import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Stripe from 'stripe';
import crypto from 'crypto';

// Initialize Stripe with lazy loading to ensure env vars are loaded
let stripe;
const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized successfully');
  }
  return stripe;
};

// @desc    Create order for guest (with auto account creation)
// @route   POST /api/orders/guest
// @access  Public
export const createGuestOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      paymentResult,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      // Guest registration details
      guestName,
      guestEmail,
      guestPassword,
    } = req.body;

    // Validate guest details
    if (!guestName || !guestEmail || !guestPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password to create your account',
      });
    }

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items',
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email: guestEmail });
    
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login instead.',
      });
    }

    // 🔒 SECURITY: Re-calculate prices on server-side
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.name} not found`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${item.name}. Available: ${product.stock}`,
        });
      }

      const actualPrice = product.price;
      const itemTotal = actualPrice * item.quantity;
      calculatedTotal += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        image: product.image,
        price: actualPrice,
      });

      if (Math.abs(item.price - actualPrice) > 0.01) {
        console.warn(`⚠️  Price manipulation detected for ${product.name}`);
      }
    }

    const calculatedShipping = shippingPrice || 10;
    const calculatedTax = calculatedTotal * 0.06;
    const calculatedFinalTotal = calculatedTotal + calculatedShipping + calculatedTax;

    const tolerance = calculatedFinalTotal * 0.01;
    if (Math.abs(totalPrice - calculatedFinalTotal) > tolerance) {
      return res.status(400).json({
        success: false,
        message: 'Order total mismatch. Please refresh and try again.',
      });
    }

    // ✅ CREATE USER ACCOUNT FIRST (after payment verification)
    user = await User.create({
      name: guestName,
      email: guestEmail,
      password: guestPassword,
      address: shippingAddress,
      isEmailVerified: true, // Auto-verify since they made a purchase
    });

    console.log('✅ New account created via purchase:', {
      userId: user._id,
      email: user.email,
      name: user.name,
    });

    // ✅ CREATE ORDER with new user
    const order = await Order.create({
      user: user._id,
      orderItems: validatedItems,
      shippingAddress,
      paymentMethod,
      paymentResult,
      itemsPrice: calculatedTotal,
      taxPrice: calculatedTax,
      shippingPrice: calculatedShipping,
      totalPrice: calculatedFinalTotal,
      isPaid: paymentMethod === 'Card' ? true : false,
      paidAt: paymentMethod === 'Card' ? Date.now() : undefined,
    });

    console.log('✅ Guest order created:', {
      orderId: order._id,
      userId: user._id,
      total: calculatedFinalTotal,
      itemsCount: validatedItems.length,
    });

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Add order to user's orders
    await User.findByIdAndUpdate(user._id, {
      $push: { orders: order._id },
    });

    // Generate auth token for auto-login
    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Account created and order placed successfully! You can now login.',
      data: {
        order,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token, // Auto-login token
      },
    });
  } catch (error) {
    console.error('Guest order error:', error);
    next(error);
  }
};

// @desc    Create new order (SECURE VERSION)
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      paymentResult,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items',
      });
    }

    // 🔒 SECURITY: Re-calculate prices on server-side
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.name} not found`,
        });
      }

      // Verify stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${item.name}. Available: ${product.stock}`,
        });
      }

      // 🔒 Use ACTUAL database price (ignore client-sent price)
      const actualPrice = product.price;
      const itemTotal = actualPrice * item.quantity;
      calculatedTotal += itemTotal;

      validatedItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        image: product.image,
        price: actualPrice, // Use actual price from DB
      });

      // Verify client didn't manipulate price
      if (Math.abs(item.price - actualPrice) > 0.01) {
        console.warn(`⚠️  Price manipulation detected for ${product.name}`);
        console.warn(`   Client sent: $${item.price}, Actual: $${actualPrice}`);
      }
    }

    // 🔒 Validate calculated totals match client totals (with tolerance)
    const calculatedShipping = shippingPrice || 10;
    const calculatedTax = calculatedTotal * 0.06;
    const calculatedFinalTotal = calculatedTotal + calculatedShipping + calculatedTax;

    // Allow 1% tolerance for rounding differences
    const tolerance = calculatedFinalTotal * 0.01;
    if (Math.abs(totalPrice - calculatedFinalTotal) > tolerance) {
      console.error('❌ Price manipulation detected!');
      console.error(`   Client total: $${totalPrice}`);
      console.error(`   Calculated total: $${calculatedFinalTotal}`);
      return res.status(400).json({
        success: false,
        message: 'Order total mismatch. Please refresh and try again.',
      });
    }

    // 🔒 Create order with VALIDATED data
    const order = await Order.create({
      user: req.user._id,
      orderItems: validatedItems, // Use validated items with actual prices
      shippingAddress,
      paymentMethod,
      paymentResult,
      itemsPrice: calculatedTotal, // Use calculated total
      taxPrice: calculatedTax,
      shippingPrice: calculatedShipping,
      totalPrice: calculatedFinalTotal, // Use calculated final total
      isPaid: paymentMethod === 'Card' ? true : false,
      paidAt: paymentMethod === 'Card' ? Date.now() : undefined,
    });

    console.log('✅ Order created:', {
      orderId: order._id,
      userId: req.user._id,
      total: calculatedFinalTotal,
      itemsCount: validatedItems.length,
    });

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Add order to user's orders
    await User.findByIdAndUpdate(req.user._id, {
      $push: { orders: order._id },
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
    };

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order to delivered (Admin)
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = 'Delivered';

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Stripe payment intent for GUEST (SECURE VERSION)
// @route   POST /api/orders/guest/create-payment-intent
// @access  Public
export const createGuestPaymentIntent = async (req, res, next) => {
  try {
    const { orderItems, shippingPrice, taxPrice, guestEmail, guestName } = req.body;

    // Validate guest details
    if (!guestEmail || !guestName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name and email',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: guestEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login instead.',
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is not defined in .env file');
      return res.status(500).json({
        success: false,
        message: 'Stripe configuration error. Please contact support.',
      });
    }

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
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.name} not found`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}. Available: ${product.stock}`,
        });
      }

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

    const finalShipping = shippingPrice || 10;
    const finalTax = taxPrice || (calculatedTotal * 0.06);
    const finalTotal = calculatedTotal + finalShipping + finalTax;

    if (finalTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order total',
      });
    }

    const amountInCents = Math.round(finalTotal * 100);

    console.log('🔒 Creating GUEST payment intent:', {
      guestEmail,
      guestName,
      itemsCount: validatedItems.length,
      total: finalTotal,
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
        total: finalTotal.toFixed(2),
        accountCreation: 'true',
      },
    });

    console.log('✅ Guest payment intent created:', paymentIntent.id);

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      validatedAmounts: {
        itemsPrice: calculatedTotal,
        shippingPrice: finalShipping,
        taxPrice: finalTax,
        totalPrice: finalTotal,
      },
    });
  } catch (error) {
    console.error('❌ Guest payment error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment intent creation failed',
    });
  }
};

// @desc    Create Stripe payment intent (SECURE VERSION)
// @route   POST /api/orders/create-payment-intent
// @access  Private
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderItems, shippingPrice, taxPrice } = req.body;

    // Validate Stripe key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is not defined in .env file');
      return res.status(500).json({
        success: false,
        message: 'Stripe configuration error. Please contact support.',
      });
    }

    // Validate order items
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided',
      });
    }

    // 🔒 SECURITY: Calculate amount on SERVER-SIDE using database prices
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of orderItems) {
      // Fetch actual product from database
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.name} not found`,
        });
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      // Use ACTUAL price from database (not from client)
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

    // Add shipping and tax
    const finalShipping = shippingPrice || 10;
    const finalTax = taxPrice || (calculatedTotal * 0.06);
    const finalTotal = calculatedTotal + finalShipping + finalTax;

    // Validate minimum amount
    if (finalTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order total',
      });
    }

    // Convert to cents (Stripe requires smallest currency unit)
    const amountInCents = Math.round(finalTotal * 100);

    console.log('🔒 Creating SECURE payment intent:', {
      userId: req.user._id,
      itemsCount: validatedItems.length,
      subtotal: calculatedTotal,
      shipping: finalShipping,
      tax: finalTax,
      total: finalTotal,
      amountInCents,
      currency: 'myr'
    });

    // Get Stripe instance
    const stripeInstance = getStripe();

    // Create payment intent with validated amount
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
        subtotal: calculatedTotal.toFixed(2),
        total: finalTotal.toFixed(2),
      },
    });

    console.log('✅ Secure payment intent created:', paymentIntent.id);

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      // Return validated amounts for frontend verification
      validatedAmounts: {
        itemsPrice: calculatedTotal,
        shippingPrice: finalShipping,
        taxPrice: finalTax,
        totalPrice: finalTotal,
      },
    });
  } catch (error) {
    console.error('❌ Stripe error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment intent creation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};