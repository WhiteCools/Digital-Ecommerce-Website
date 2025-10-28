import User from '../models/User.js';
import Product from '../models/Product.js';

export const getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.product');

    res.status(200).json({
      success: true,
      data: user.cart,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Not enough stock',
      });
    }

    const user = await User.findById(req.user._id);

    const existingItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }

    await user.save();
    await user.populate('cart.product');

    res.status(200).json({
      success: true,
      data: user.cart,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const user = await User.findById(req.user._id);

    const cartItem = user.cart.find(
      (item) => item.product.toString() === req.params.productId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart',
      });
    }

    const product = await Product.findById(req.params.productId);
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Not enough stock',
      });
    }

    cartItem.quantity = quantity;
    await user.save();
    await user.populate('cart.product');

    res.status(200).json({
      success: true,
      data: user.cart,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    user.cart = user.cart.filter(
      (item) => item.product.toString() !== req.params.productId
    );

    await user.save();
    await user.populate('cart.product');

    res.status(200).json({
      success: true,
      data: user.cart,
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    next(error);
  }
};

export const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');

    res.status(200).json({
      success: true,
      data: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const user = await User.findById(req.user._id);

    if (user.wishlist.includes(req.params.productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist',
      });
    }

    user.wishlist.push(req.params.productId);
    await user.save();
    await user.populate('wishlist');

    res.status(200).json({
      success: true,
      data: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== req.params.productId
    );

    await user.save();
    await user.populate('wishlist');

    res.status(200).json({
      success: true,
      data: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};