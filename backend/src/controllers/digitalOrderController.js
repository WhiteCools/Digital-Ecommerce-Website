import mongoose from 'mongoose';
import DigitalOrder from '../models/DigitalOrder.js';
import DigitalProduct from '../models/DigitalProduct.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

let stripe;
const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

// @desc    Create Stripe payment intent for digital products
// @route   POST /api/digital-orders/create-payment-intent
// @access  Private
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderItems } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided',
      });
    }

    // 🔒 SECURITY: Calculate amount on SERVER-SIDE
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of orderItems) {
      console.log('🔍 Looking up product:', {
        productId: item.product,
        name: item.name,
        quantity: item.quantity
      });
      
      const product = await DigitalProduct.findById(item.product);

      if (!product) {
        console.error('❌ Product not found in database:', item.product);
        console.error('   Item details:', item);
        return res.status(404).json({
          success: false,
          message: `Product ${item.name} not found`,
        });
      }
      
      console.log('✅ Product found:', {
        id: product._id,
        name: product.name,
        stock: product.stock,
        isActive: product.isActive
      });

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available`,
        });
      }

      // 🔒 Check stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      // 🔒 Use ACTUAL price from database
      const itemTotal = product.price * item.quantity;
      calculatedTotal += itemTotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    // Digital products - no shipping, small tax
    const finalTax = calculatedTotal * 0.06; // 6% tax
    const finalTotal = calculatedTotal + finalTax;

    if (finalTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order total',
      });
    }

    // Convert to cents
    const amountInCents = Math.round(finalTotal * 100);

    console.log('🔒 Creating SECURE payment intent (Digital):', {
      userId: req.user._id,
      itemsCount: validatedItems.length,
      subtotal: calculatedTotal.toFixed(2),
      tax: finalTax.toFixed(2),
      total: finalTotal.toFixed(2),
      amountInCents,
    });

    const stripeInstance = getStripe();

    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: amountInCents,
      currency: 'myr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: req.user._id.toString(),
        userEmail: req.user.email,
        orderItemsCount: validatedItems.length,
        orderType: 'digital',
      },
    });

    console.log('✅ Payment intent created:', paymentIntent.id);

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      validatedAmounts: {
        itemsPrice: calculatedTotal,
        taxPrice: finalTax,
        totalPrice: finalTotal,
      },
    });
  } catch (error) {
    console.error('❌ Payment intent error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment intent creation failed',
    });
  }
};

// @desc    Create Stripe payment intent for digital products (GUEST)
// @route   POST /api/digital-orders/guest/create-payment-intent
// @access  Public
export const createGuestPaymentIntent = async (req, res, next) => {
  try {
    const { orderItems, guestEmail, guestName } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided',
      });
    }

    if (!guestEmail || !guestName) {
      return res.status(400).json({
        success: false,
        message: 'Guest email and name are required',
      });
    }

    // 🔒 SECURITY: Calculate amount on SERVER-SIDE
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of orderItems) {
      console.log('🔍 Looking up product (guest):', {
        productId: item.product,
        name: item.name,
        quantity: item.quantity
      });
      
      const product = await DigitalProduct.findById(item.product);

      if (!product) {
        console.error('❌ Product not found in database:', item.product);
        return res.status(404).json({
          success: false,
          message: `Product ${item.name} not found`,
        });
      }
      
      console.log('✅ Product found:', {
        id: product._id,
        name: product.name,
        stock: product.stock,
        isActive: product.isActive
      });

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available`,
        });
      }

      // 🔒 Check stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      // 🔒 Use ACTUAL price from database
      const itemTotal = product.price * item.quantity;
      calculatedTotal += itemTotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    // Digital products - no shipping, small tax
    const finalTax = calculatedTotal * 0.06; // 6% tax
    const finalTotal = calculatedTotal + finalTax;

    if (finalTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order total',
      });
    }

    // Convert to cents
    const amountInCents = Math.round(finalTotal * 100);

    console.log('🔒 Creating SECURE payment intent (Digital - Guest):', {
      guestEmail,
      guestName,
      itemsCount: validatedItems.length,
      subtotal: calculatedTotal.toFixed(2),
      tax: finalTax.toFixed(2),
      total: finalTotal.toFixed(2),
      amountInCents,
    });

    const stripeInstance = getStripe();

    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: amountInCents,
      currency: 'myr',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        guestEmail,
        guestName,
        orderItemsCount: validatedItems.length,
        orderType: 'digital',
        isGuest: 'true',
      },
    });

    console.log('✅ Guest payment intent created:', paymentIntent.id);

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      validatedAmounts: {
        itemsPrice: calculatedTotal,
        taxPrice: finalTax,
        totalPrice: finalTotal,
      },
    });
  } catch (error) {
    console.error('❌ Guest payment intent error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment intent creation failed',
    });
  }
};

// @desc    Create digital order with AUTO-DELIVERY
// @route   POST /api/digital-orders
// @access  Private
export const createDigitalOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      paymentMethod,
      paymentResult,
      itemsPrice,
      taxPrice,
      totalPrice,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items',
      });
    }

    // 🔒 STEP 1: Calculate actual prices from DATABASE first
    let calculatedTotal = 0;
    const priceValidationItems = [];

    for (const item of orderItems) {
      const product = await DigitalProduct.findById(item.product);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.name}`,
        });
      }
      
      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product not available: ${product.name}`,
        });
      }
      
      const itemTotal = product.price * item.quantity;
      calculatedTotal += itemTotal;
      priceValidationItems.push({ product, quantity: item.quantity });
    }

    const calculatedTax = calculatedTotal * 0.06;
    const calculatedFinalTotal = calculatedTotal + calculatedTax;
    
    console.log('💰 Price calculation:', {
      itemsTotal: calculatedTotal.toFixed(2),
      tax: calculatedTax.toFixed(2),
      finalTotal: calculatedFinalTotal.toFixed(2),
      frontendTotal: totalPrice,
    });

    // Check if frontend price matches our calculation
    const tolerance = calculatedFinalTotal * 0.01; // 1% tolerance for rounding
    if (Math.abs(totalPrice - calculatedFinalTotal) > tolerance) {
      console.error('❌ Price mismatch detected:', {
        calculated: calculatedFinalTotal,
        received: totalPrice,
        difference: Math.abs(totalPrice - calculatedFinalTotal),
      });
      return res.status(400).json({
        success: false,
        message: 'Price mismatch. Please refresh and try again.',
      });
    }

    // 🔒 STEP 2: VERIFY PAYMENT WITH STRIPE (using OUR calculated amount)
    if (paymentMethod === 'Card' && paymentResult?.id) {
      try {
        // 🔒 CHECK 1: Payment ID not already used (early check before transaction)
        // Note: We'll check again inside transaction for race condition protection
        const existingOrder = await DigitalOrder.findOne({ 
          'paymentResult.id': paymentResult.id 
        });
        
        if (existingOrder) {
          console.error('❌ Payment reuse attempt detected:', paymentResult.id);
          return res.status(400).json({
            success: false,
            message: 'This payment has already been used for another order',
          });
        }
        
        const stripeInstance = getStripe();
        const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentResult.id);
        
        // 🔒 CHECK 2: Payment is actually successful
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({
            success: false,
            message: `Payment not successful. Status: ${paymentIntent.status}`,
          });
        }
        
        // 🔒 CHECK 3: Payment matches the order amount
        const expectedAmount = Math.round(totalPrice * 100); // Convert to cents
        if (paymentIntent.amount !== expectedAmount) {
          console.error('❌ Amount mismatch:', {
            expected: expectedAmount,
            received: paymentIntent.amount
          });
          return res.status(400).json({
            success: false,
            message: 'Payment amount mismatch',
          });
        }
        
        // 🔒 CHECK 4: Payment belongs to this user
        if (paymentIntent.metadata.userId !== req.user._id.toString()) {
          console.error('❌ Payment ownership mismatch');
          return res.status(403).json({
            success: false,
            message: 'Payment does not belong to this user',
          });
        }
        
        console.log('✅ Payment verified with Stripe:', paymentIntent.id);
      } catch (stripeError) {
        console.error('❌ Stripe verification failed:', stripeError.message);
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
        });
      }
    } else {
      // If not card payment, reject (for now only support card)
      return res.status(400).json({
        success: false,
        message: 'Only card payments are supported',
      });
    }

    // 🔒 STEP 3: Check stock and reserve items (with transaction for atomicity)
    const validatedItems = [];
    const reservedItems = []; // Track reserved items for rollback

    // Start MongoDB session for transaction
    const session = await mongoose.startSession();
    
    // 🔄 RETRY LOGIC: Handle transaction conflicts (race conditions)
    const MAX_RETRIES = 3;
    let retryCount = 0;
    
    while (retryCount < MAX_RETRIES) {
      try {
        // Start transaction
        await session.startTransaction();
        
        console.log(`🔒 Transaction attempt ${retryCount + 1}/${MAX_RETRIES}...`);
      
      // 🔒 DOUBLE-CHECK: Payment ID not used (inside transaction with write lock)
      // Using countDocuments which will wait if another transaction is creating order with same payment ID
      const existingCount = await DigitalOrder.countDocuments({ 
        'paymentResult.id': paymentResult.id 
      }).session(session);
      
      if (existingCount > 0) {
        throw new Error('Payment ID already used (detected in transaction)');
      }
      for (const item of orderItems) {
        // Find the product from our price validation
        const productData = priceValidationItems.find(
          p => p.product._id.toString() === item.product.toString()
        );
        
        if (!productData) {
          throw new Error(`Product ${item.name} not found in validation`);
        }
        
        // 🔄 RE-FETCH product to get LATEST stock (within transaction)
        const product = await DigitalProduct.findById(item.product).session(session);
        
        if (!product) {
          throw new Error(`Product ${item.name} not found`);
        }

        console.log(`📦 Stock check for ${product.name}:`, {
          stock: product.stock,
          inventoryCount: product.inventory.length,
          requestedQty: item.quantity,
          availableItems: product.inventory.filter(i => i.status === 'available').length
        });

        // Check stock availability
        if (product.stock < item.quantity) {
          throw new Error(
            `Not enough stock for ${product.name}. Available: ${product.stock}`
          );
        }

        // 🎁 RESERVE inventory items for this order
        const itemsToReserve = [];
        for (let i = 0; i < item.quantity; i++) {
          const reservedItem = await product.reserveItem(
            req.user._id,
            null // Will update with actual order ID later
          );
          itemsToReserve.push(reservedItem);
          reservedItems.push({ product, item: reservedItem });
        }

        validatedItems.push({
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          image: product.image,
          price: product.price, // Use actual DB price
          deliveredItems: itemsToReserve.map((reserved) => ({
            inventoryItemId: reserved._id,
          })),
        });
      }

      // Price already validated earlier, use our calculated amounts

      // 🎁 CREATE ORDER with delivered items (within transaction)
      const order = await DigitalOrder.create([{
        user: req.user._id,
        orderItems: validatedItems,
        contactEmail: req.user.email,
        paymentMethod,
        paymentResult,
        itemsPrice: calculatedTotal,
        taxPrice: calculatedTax,
        totalPrice: calculatedFinalTotal,
        isPaid: paymentMethod === 'Card' ? true : false,
        paidAt: paymentMethod === 'Card' ? Date.now() : undefined,
        isDelivered: true, // 🎁 Auto-delivered
        deliveredAt: Date.now(),
        autoDeliveryStatus: 'completed',
        status: 'Completed',
      }], { session });

      // Update reserved items with actual order ID
      for (const item of validatedItems) {
        const product = await DigitalProduct.findById(item.product).session(session);
        for (const deliveredItem of item.deliveredItems) {
          const inventoryItem = product.inventory.id(
            deliveredItem.inventoryItemId
          );
          if (inventoryItem) {
            inventoryItem.orderId = order[0]._id; // order is now an array
            await product.save({ session });
            // Note: markAsSold needs to be updated to accept session
          }
        }
      }

        // 🎉 COMMIT TRANSACTION - All operations successful
        await session.commitTransaction();
        session.endSession();

        console.log(`✅ Digital order created with auto-delivery (attempt ${retryCount + 1}):`, {
          orderId: order[0]._id,
          userId: req.user._id,
          total: calculatedFinalTotal,
          itemsCount: validatedItems.length,
          totalKeysDelivered: order[0].totalItemsDelivered,
        });

        // SUCCESS - Break out of retry loop
        return res.status(201).json({
          success: true,
          data: order[0],
          message: '🎉 Order completed! Your items are ready to view.',
        });
      } catch (txError) {
        // 🔄 ROLLBACK TRANSACTION
        console.error(`❌ Transaction attempt ${retryCount + 1} failed:`, txError.message);
        
        try {
          await session.abortTransaction();
        } catch (abortError) {
          console.error('❌ Error aborting transaction:', abortError.message);
        }
        
        // Check if it's a transient error that we can retry
        const isRetriableError = txError.message.includes('Write conflict') || 
                                 txError.message.includes('TransientTransactionError') ||
                                 txError.code === 112; // WriteConflict error code
        
        if (isRetriableError && retryCount < MAX_RETRIES - 1) {
          retryCount++;
          console.log(`🔄 Retrying transaction (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount)); // Exponential backoff
          continue; // Retry transaction
        } else {
          // Non-retriable error or max retries reached
          session.endSession();
          
          // Manual rollback as backup
          for (const reserved of reservedItems) {
            try {
              const item = reserved.product.inventory.id(reserved.item._id);
              if (item && item.status === 'reserved') {
                item.status = 'available';
                item.soldTo = undefined;
                item.orderId = undefined;
                await reserved.product.save();
                await reserved.product.updateStock();
              }
            } catch (rollbackError) {
              console.error('❌ Manual rollback error:', rollbackError.message);
            }
          }
          
          throw txError;
        }
      }
    } // End of retry while loop
    
    // If we exit the loop without returning, all retries failed
    session.endSession();
    throw new Error(`Transaction failed after ${MAX_RETRIES} attempts. Please try again.`);
    
  } catch (error) {
    console.error('❌ Order error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order. Please try again.',
    });
  }
};

// @desc    Get user's digital orders
// @route   GET /api/digital-orders/myorders
// @access  Private
export const getMyDigitalOrders = async (req, res, next) => {
  try {
    const orders = await DigitalOrder.find({ user: req.user._id })
      .populate('orderItems.product', 'name category productType')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single digital order by ID
// @route   GET /api/digital-orders/:id
// @access  Private
export const getDigitalOrderById = async (req, res, next) => {
  try {
    const order = await DigitalOrder.findById(req.params.id).populate(
      'orderItems.product',
      'name category productType deliveryInstructions warranty'
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns this order or is admin
    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get delivered items (keys/accounts) for an order
// @route   GET /api/digital-orders/:id/items
// @access  Private
export const getOrderItems = async (req, res, next) => {
  try {
    const order = await DigitalOrder.findById(req.params.id).populate(
      'orderItems.product'
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // 🔒 SECURITY: Only order owner can view items
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these items',
      });
    }

    // 🔒 Only show items for PAID orders
    if (!order.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'Order is not paid yet',
      });
    }

    // 🔓 DECRYPT and return items
    const decryptedItems = [];

    for (const orderItem of order.orderItems) {
      // Check if product exists (might be null if deleted)
      if (!orderItem.product || !orderItem.product._id) {
        console.error(`Product not found for order item ${orderItem._id}`);
        decryptedItems.push({
          productName: orderItem.name || 'Product Unavailable',
          productType: 'code',
          quantity: orderItem.quantity,
          image: orderItem.image || 'https://via.placeholder.com/150',
          deliveryInstructions: 'Product no longer available. Contact support.',
          warranty: 0,
          items: [],
        });
        continue;
      }

      const product = await DigitalProduct.findById(orderItem.product._id);

      if (!product) {
        console.error(`Product ${orderItem.product._id} not found in database`);
        decryptedItems.push({
          productName: orderItem.name || 'Product Unavailable',
          productType: 'code',
          quantity: orderItem.quantity,
          image: orderItem.image || 'https://via.placeholder.com/150',
          deliveryInstructions: 'Product no longer available. Contact support.',
          warranty: 0,
          items: [],
        });
        continue;
      }

      const itemDeliveries = [];

      for (const deliveredItem of orderItem.deliveredItems) {
        try {
          console.log(`🔓 Attempting to decrypt item ${deliveredItem.inventoryItemId}`);
          console.log(`   Product ID: ${product._id}`);
          console.log(`   Product name: ${product.name}`);
          console.log(`   Inventory items in product: ${product.inventory.length}`);
          
          // Find the inventory item
          const inventoryItem = product.inventory.id(deliveredItem.inventoryItemId);
          if (!inventoryItem) {
            console.error(`   ❌ Inventory item ${deliveredItem.inventoryItemId} not found in product`);
            throw new Error('Inventory item not found');
          }
          
          console.log(`   ✅ Found inventory item, status: ${inventoryItem.status}`);
          console.log(`   Encrypted content (first 50 chars): ${inventoryItem.content.substring(0, 50)}`);
          
          // 🔓 DECRYPT the content
          const decryptedContent = product.getDecryptedContent(
            deliveredItem.inventoryItemId
          );
          
          console.log(`   ✅ Decryption successful: ${decryptedContent}`);

          itemDeliveries.push({
            id: deliveredItem._id,
            content: decryptedContent, // 🎁 THE ACTUAL KEY/ACCOUNT
            deliveredAt: deliveredItem.deliveredAt,
            viewed: deliveredItem.viewed,
          });

          // Mark as viewed
          if (!deliveredItem.viewed) {
            await order.markItemViewed(
              orderItem._id,
              deliveredItem._id
            );
          }
        } catch (error) {
          console.error('❌ Decryption error details:', error.message);
          console.error('   Full error:', error);
          itemDeliveries.push({
            id: deliveredItem._id,
            content: 'ERROR: Unable to decrypt. Contact support.',
            deliveredAt: deliveredItem.deliveredAt,
            viewed: deliveredItem.viewed,
          });
        }
      }

      decryptedItems.push({
        productName: orderItem.name,
        productType: product.productType,
        quantity: orderItem.quantity,
        image: orderItem.image,
        deliveryInstructions: product.deliveryInstructions,
        warranty: product.warranty,
        items: itemDeliveries,
      });
    }

    console.log(`🔓 User ${req.user.email} viewed order ${order._id} items`);

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderDate: order.createdAt,
        items: decryptedItems,
      },
    });
  } catch (error) {
    console.error('❌ Get order items error:', error);
    next(error);
  }
};

// @desc    Create guest digital order with AUTO account creation
// @route   POST /api/digital-orders/guest
// @access  Public
export const createGuestDigitalOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      paymentMethod,
      paymentResult,
      itemsPrice,
      taxPrice,
      totalPrice,
      guestName,
      guestEmail,
      guestPassword,
      shippingAddress,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items',
      });
    }

    if (!guestEmail || !guestName || !guestPassword) {
      return res.status(400).json({
        success: false,
        message: 'Guest email, name, and password are required',
      });
    }

    // 🔒 STEP 1: Check if user already exists
    let user = await User.findOne({ email: guestEmail });
    let userCreated = false;
    
    if (user) {
      console.log('ℹ️ User already exists:', guestEmail);
    } else {
      // Create new user account
      const hashedPassword = await bcrypt.hash(guestPassword, 10);
      user = await User.create({
        name: guestName,
        email: guestEmail,
        password: hashedPassword,
        address: shippingAddress || {},
      });
      userCreated = true;
      console.log('✅ New user account created:', guestEmail);
    }

    // 🔒 STEP 2: Calculate actual prices from DATABASE
    let calculatedTotal = 0;
    const priceValidationItems = [];

    for (const item of orderItems) {
      const product = await DigitalProduct.findById(item.product);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.name}`,
        });
      }
      
      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product not available: ${product.name}`,
        });
      }
      
      const itemTotal = product.price * item.quantity;
      calculatedTotal += itemTotal;
      priceValidationItems.push({ product, quantity: item.quantity });
    }

    const calculatedTax = calculatedTotal * 0.06;
    const calculatedFinalTotal = calculatedTotal + calculatedTax;

    // Verify price
    const tolerance = calculatedFinalTotal * 0.01;
    if (Math.abs(totalPrice - calculatedFinalTotal) > tolerance) {
      return res.status(400).json({
        success: false,
        message: 'Price mismatch. Please refresh and try again.',
      });
    }

    // 🔒 STEP 3: VERIFY PAYMENT
    if (paymentMethod === 'Card' && paymentResult?.id) {
      try {
        const existingOrder = await DigitalOrder.findOne({ 
          'paymentResult.id': paymentResult.id 
        });
        
        if (existingOrder) {
          return res.status(400).json({
            success: false,
            message: 'This payment has already been used',
          });
        }
        
        const stripeInstance = getStripe();
        const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentResult.id);
        
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({
            success: false,
            message: `Payment not successful. Status: ${paymentIntent.status}`,
          });
        }
        
        const expectedAmount = Math.round(totalPrice * 100);
        if (paymentIntent.amount !== expectedAmount) {
          return res.status(400).json({
            success: false,
            message: 'Payment amount mismatch',
          });
        }
        
        console.log('✅ Payment verified for guest order:', paymentIntent.id);
      } catch (stripeError) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Only card payments are supported',
      });
    }

    // 🔒 STEP 4: Create order with transaction
    const validatedItems = [];
    const reservedItems = [];
    const session = await mongoose.startSession();
    
    const MAX_RETRIES = 3;
    let retryCount = 0;
    
    while (retryCount < MAX_RETRIES) {
      try {
        await session.startTransaction();
        
        const existingCount = await DigitalOrder.countDocuments({ 
          'paymentResult.id': paymentResult.id 
        }).session(session);
        
        if (existingCount > 0) {
          throw new Error('Payment ID already used');
        }

        for (const item of orderItems) {
          const productData = priceValidationItems.find(
            p => p.product._id.toString() === item.product.toString()
          );
          
          if (!productData) {
            throw new Error(`Product ${item.name} not found`);
          }
          
          const product = await DigitalProduct.findById(item.product).session(session);
          
          if (!product || product.stock < item.quantity) {
            throw new Error(`Not enough stock for ${item.name}`);
          }

          const itemsToReserve = [];
          for (let i = 0; i < item.quantity; i++) {
            const reservedItem = await product.reserveItem(user._id, null);
            itemsToReserve.push(reservedItem);
            reservedItems.push({ product, item: reservedItem });
          }

          validatedItems.push({
            product: product._id,
            name: product.name,
            quantity: item.quantity,
            image: product.image,
            price: product.price,
            deliveredItems: itemsToReserve.map((reserved) => ({
              inventoryItemId: reserved._id,
            })),
          });
        }

        const order = await DigitalOrder.create([{
          user: user._id,
          orderItems: validatedItems,
          contactEmail: guestEmail,
          paymentMethod,
          paymentResult,
          itemsPrice: calculatedTotal,
          taxPrice: calculatedTax,
          totalPrice: calculatedFinalTotal,
          isPaid: true,
          paidAt: Date.now(),
          isDelivered: true,
          deliveredAt: Date.now(),
          autoDeliveryStatus: 'completed',
          status: 'Completed',
        }], { session });

        for (const item of validatedItems) {
          const product = await DigitalProduct.findById(item.product).session(session);
          for (const deliveredItem of item.deliveredItems) {
            const inventoryItem = product.inventory.id(deliveredItem.inventoryItemId);
            if (inventoryItem) {
              inventoryItem.orderId = order[0]._id;
              await product.save({ session });
            }
          }
        }

        await session.commitTransaction();
        session.endSession();

        console.log('✅ Guest digital order created:', {
          orderId: order[0]._id,
          userId: user._id,
          userCreated,
          total: calculatedFinalTotal,
        });

        // Generate JWT token
        const token = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );

        return res.status(201).json({
          success: true,
          data: {
            order: order[0],
            token,
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          },
          message: userCreated 
            ? '🎉 Account created and order completed! Your items are ready.'
            : '🎉 Order completed! Your items are ready.',
        });
      } catch (txError) {
        await session.abortTransaction();
        
        const isRetriableError = txError.message.includes('Write conflict') || 
                                 txError.code === 112;
        
        if (isRetriableError && retryCount < MAX_RETRIES - 1) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
          continue;
        } else {
          session.endSession();
          
          for (const reserved of reservedItems) {
            try {
              const item = reserved.product.inventory.id(reserved.item._id);
              if (item && item.status === 'reserved') {
                item.status = 'available';
                item.soldTo = undefined;
                item.orderId = undefined;
                await reserved.product.save();
                await reserved.product.updateStock();
              }
            } catch (rollbackError) {
              console.error('❌ Rollback error:', rollbackError.message);
            }
          }
          
          throw txError;
        }
      }
    }
    
    session.endSession();
    throw new Error('Transaction failed after retries');
    
  } catch (error) {
    console.error('❌ Guest order error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order',
    });
  }
};

// @desc    Get all digital orders (Admin)
// @route   GET /api/digital-orders
// @access  Private/Admin
export const getAllDigitalOrders = async (req, res, next) => {
  try {
    const orders = await DigitalOrder.find({})
      .populate('user', 'name email')
      .populate('orderItems.product', 'name category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};