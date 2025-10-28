import Product from '../models/Product.js';
import DigitalProduct from '../models/DigitalProduct.js';
import Order from '../models/Order.js';
import DigitalOrder from '../models/DigitalOrder.js';
import User from '../models/User.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    // 🔒 SECURITY: Double-check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }

    // Run all queries in parallel for performance
    const [
      totalUsers,
      totalProducts,
      totalDigitalProducts,
      totalOrders,
      totalDigitalOrders,
      pendingOrders,
      lowStockProducts,
      activeUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ isActive: true }),
      DigitalProduct.countDocuments({ isActive: true }),
      Order.countDocuments(),
      DigitalOrder.countDocuments(),
      Order.countDocuments({ status: 'Pending' }),
      Product.countDocuments({ stock: { $lt: 10 }, isActive: true }),
      User.countDocuments({ isActive: true }),
    ]);

    // Calculate total revenue from both order types
    const physicalRevenue = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    const digitalRevenue = await DigitalOrder.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    const totalRevenue =
      (physicalRevenue[0]?.total || 0) + (digitalRevenue[0]?.total || 0);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await Order.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    const recentDigitalOrders = await DigitalOrder.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalDigitalProducts,
        totalOrders: totalOrders + totalDigitalOrders,
        totalRevenue,
        pendingOrders,
        lowStockItems: lowStockProducts,
        activeProducts: totalProducts + totalDigitalProducts,
        activeUsers,
        recentActivity: {
          orders: recentOrders + recentDigitalOrders,
          users: recentUsers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products (physical)
// @route   GET /api/admin/products
// @access  Private/Admin
export const getAllProducts = async (req, res, next) => {
  try {
    // 🔒 SECURITY: Double-check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .select('-reviews'); // Don't send reviews for performance

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all digital products
// @route   GET /api/admin/digital-products
// @access  Private/Admin
export const getAllDigitalProducts = async (req, res, next) => {
  try {
    // 🔒 SECURITY: Double-check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }

    const products = await DigitalProduct.find()
      .sort({ createdAt: -1 })
      .select('-inventory.content'); // 🔒 NEVER send encrypted content

    // Add inventory stats to each product
    const productsWithStats = products.map((product) => {
      const productObj = product.toObject();
      return {
        ...productObj,
        inventoryStats: {
          total: product.inventory?.length || 0,
          available:
            product.inventory?.filter((item) => item.status === 'available')
              .length || 0,
          sold:
            product.inventory?.filter((item) => item.status === 'sold').length ||
            0,
          reserved:
            product.inventory?.filter((item) => item.status === 'reserved')
              .length || 0,
        },
      };
    });

    res.status(200).json({
      success: true,
      count: productsWithStats.length,
      data: productsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all digital orders
// @route   GET /api/admin/digital-orders
// @access  Private/Admin
export const getAllDigitalOrders = async (req, res, next) => {
  try {
    // 🔒 SECURITY: Double-check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }

    const orders = await DigitalOrder.find()
      .populate('user', 'name email')
      .populate('orderItems.product', 'name category')
      .sort({ createdAt: -1 })
      .select('-orderItems.deliveredItems'); // 🔒 Don't send keys to admin dashboard

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    // 🔒 SECURITY: Double-check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }

    const users = await User.find()
      .select('-password -twoFactorSecret -twoFactorBackupCodes') // 🔒 NEVER send sensitive data
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res, next) => {
  try {
    // 🔒 SECURITY: Double-check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }

    const { role } = req.body;

    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be user or admin.',
      });
    }

    // 🔒 SECURITY: Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.',
      });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    console.log(`✅ Admin ${req.user.name} changed ${user.name}'s role to ${role}`);

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
export const toggleUserStatus = async (req, res, next) => {
  try {
    // 🔒 SECURITY: Double-check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }

    // 🔒 SECURITY: Prevent admin from deactivating themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    console.log(
      `✅ Admin ${req.user.name} ${user.isActive ? 'activated' : 'deactivated'} ${user.name}'s account`
    );

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    // 🔒 SECURITY: Double-check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }

    // 🔒 SECURITY: Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Soft delete - just deactivate
    user.isActive = false;
    await user.save();

    console.log(`✅ Admin ${req.user.name} deleted user ${user.name}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system logs (Future feature)
// @route   GET /api/admin/logs
// @access  Private/Admin
export const getSystemLogs = async (req, res, next) => {
  try {
    // 🔒 SECURITY: Double-check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }

    // TODO: Implement logging system
    res.status(200).json({
      success: true,
      message: 'System logs feature coming soon',
      data: [],
    });
  } catch (error) {
    next(error);
  }
};