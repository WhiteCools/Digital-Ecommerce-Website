import DigitalProduct from '../models/DigitalProduct.js';
import DigitalOrder from '../models/DigitalOrder.js';

// @desc    Get all digital products
// @route   GET /api/digital-products
// @access  Public
export const getDigitalProducts = async (req, res, next) => {
  try {
    const { category, search, minPrice, maxPrice, featured, sort } = req.query;

    // Build query
    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (featured) {
      query.featured = featured === 'true';
    }

    // Only show products with stock
    query.stock = { $gt: 0 };

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'popular':
        sortOption = { totalSold: -1 };
        break;
      default:
        sortOption = { featured: -1, createdAt: -1 };
    }

    const products = await DigitalProduct.find(query)
      .select('-inventory') // 🔒 NEVER send inventory to client
      .sort(sortOption);

    // Map products to include effectivePrice
    const productsWithPrice = products.map(product => {
      const productObj = product.toObject({ virtuals: true });
      return productObj;
    });

    res.status(200).json({
      success: true,
      count: productsWithPrice.length,
      data: productsWithPrice,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single digital product
// @route   GET /api/digital-products/:id
// @access  Public
export const getDigitalProduct = async (req, res, next) => {
  try {
    const product = await DigitalProduct.findById(req.params.id).select(
      '-inventory' // 🔒 NEVER send inventory
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product is not available',
      });
    }

    // Include virtuals like effectivePrice
    const productObj = product.toObject({ virtuals: true });

    res.status(200).json({
      success: true,
      data: productObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create digital product (Admin)
// @route   POST /api/digital-products
// @access  Private/Admin
export const createDigitalProduct = async (req, res, next) => {
  try {
    const product = await DigitalProduct.create(req.body);

    console.log('✅ Digital product created:', product.name);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update digital product (Admin)
// @route   PUT /api/digital-products/:id
// @access  Private/Admin
export const updateDigitalProduct = async (req, res, next) => {
  try {
    // Don't allow updating inventory through this route
    delete req.body.inventory;

    const product = await DigitalProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).select('-inventory');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    console.log('✅ Product updated:', product.name);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete digital product (Admin)
// @route   DELETE /api/digital-products/:id
// @access  Private/Admin
export const deleteDigitalProduct = async (req, res, next) => {
  try {
    const product = await DigitalProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Soft delete - just mark as inactive
    product.isActive = false;
    await product.save();

    console.log('✅ Product deactivated:', product.name);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add inventory items to product (Admin)
// @route   POST /api/digital-products/:id/inventory
// @access  Private/Admin
export const addInventoryItems = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of content strings

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide items array',
      });
    }

    const product = await DigitalProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Add each item (will be encrypted automatically)
    for (const item of items) {
      await DigitalProduct.addInventoryItem(
        product._id,
        item.trim(),
        req.user._id
      );
    }

    // Reload product to get updated stock
    const updatedProduct = await DigitalProduct.findById(req.params.id).select(
      '-inventory.content' // Don't send encrypted content
    );

    console.log(
      `✅ Added ${items.length} items to ${product.name}. New stock: ${updatedProduct.stock}`
    );

    res.status(200).json({
      success: true,
      message: `Added ${items.length} items successfully`,
      data: {
        productId: updatedProduct._id,
        productName: updatedProduct.name,
        newStock: updatedProduct.stock,
        itemsAdded: items.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product inventory (Admin only)
// @route   GET /api/digital-products/:id/inventory
// @access  Private/Admin
export const getProductInventory = async (req, res, next) => {
  try {
    const product = await DigitalProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Return inventory stats (NOT the actual encrypted content)
    const inventoryStats = {
      total: product.inventory.length,
      available: product.inventory.filter((item) => item.status === 'available')
        .length,
      sold: product.inventory.filter((item) => item.status === 'sold').length,
      reserved: product.inventory.filter((item) => item.status === 'reserved')
        .length,
    };

    res.status(200).json({
      success: true,
      data: {
        productName: product.name,
        stats: inventoryStats,
        // Only send metadata, NOT content
        items: product.inventory.map((item) => ({
          _id: item._id,
          status: item.status,
          soldAt: item.soldAt,
          createdAt: item.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get categories with product counts
// @route   GET /api/digital-products/categories/list
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await DigitalProduct.aggregate([
      { $match: { isActive: true, stock: { $gt: 0 } } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: categories.map((cat) => ({
        name: cat._id,
        count: cat.count,
        totalStock: cat.totalStock,
      })),
    });
  } catch (error) {
    next(error);
  }
};