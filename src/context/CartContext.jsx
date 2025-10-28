import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Load cart from localStorage (digital products)
  useEffect(() => {
    const localCart = localStorage.getItem('guestCart');
    if (localCart) {
      try {
        const parsed = JSON.parse(localCart);
        console.log('📦 Loading cart from localStorage:', parsed);
        // Validate cart items have proper structure
        const validCart = parsed.filter(item => {
          const hasProduct = item.product && (item.product._id || item.product.id);
          if (!hasProduct) {
            console.warn('⚠️ Removing invalid cart item:', item);
          }
          return hasProduct;
        });
        setCart(validCart);
        // Update localStorage with cleaned cart
        if (validCart.length !== parsed.length) {
          localStorage.setItem('guestCart', JSON.stringify(validCart));
        }
      } catch (err) {
        console.error('Failed to parse cart:', err);
        localStorage.removeItem('guestCart');
      }
    }
  }, []);

  // Fetch cart from backend
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.data.data || []);
          } catch (error) {
        // Error fetching cart
      } finally {
      setLoading(false);
    }
  };

  // Add to cart (localStorage only for digital products)
  const addToCart = async (product, quantity = 1) => {
    try {
      // Digital products - use localStorage for simplicity
      console.log('🛒 Adding to cart:', {
        productId: product._id || product.id,
        productName: product.name,
        hasId: !!product._id,
        hasId2: !!product.id
      });
      const productId = product._id || product.id;
      const existingItem = cart.find(item => (item.product._id || item.product.id) === productId);
      let newCart;
      
      // Check stock
      if (product.stock < quantity) {
        return { 
          success: false, 
          message: 'Not enough stock available' 
        };
      }
      
      if (existingItem) {
        // Check if adding more won't exceed stock
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          return { 
            success: false, 
            message: `Only ${product.stock} items available` 
          };
        }
        
        newCart = cart.map(item =>
          (item.product._id || item.product.id) === productId
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        newCart = [...cart, { product, quantity }];
      }
      
      setCart(newCart);
      localStorage.setItem('guestCart', JSON.stringify(newCart));
      
          return { success: true };
  } catch (error) {
    return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to add to cart' 
      };
    }
  };

  // Update cart item quantity
  const updateQuantity = async (productId, quantity) => {
    try {
      const item = cart.find(item => (item.product._id || item.product.id) === productId);
      
      // Check stock
      if (item && quantity > item.product.stock) {
        alert(`Only ${item.product.stock} items available`);
        return;
      }
      
      const newCart = cart.map(item =>
        (item.product._id || item.product.id) === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      );
      setCart(newCart);
      localStorage.setItem('guestCart', JSON.stringify(newCart));
    } catch (error) {
      // Error updating quantity
    }
  };

  // Remove from cart
  const removeFromCart = async (productId) => {
    try {
      const newCart = cart.filter(item => (item.product._id || item.product.id) !== productId);
      setCart(newCart);
      localStorage.setItem('guestCart', JSON.stringify(newCart));
    } catch (error) {
      // Error removing from cart
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      setCart([]);
      localStorage.removeItem('guestCart');
          } catch (error) {
        // Error clearing cart
      }
  };

  // Calculate cart count
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate total price
  const totalPrice = cart.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  const value = {
    cart,
    loading,
    cartCount,
    totalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;