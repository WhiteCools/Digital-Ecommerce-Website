import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Minus, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

const CartSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { cart, cartCount, totalPrice, updateQuantity, removeFromCart } = useCart();
  const { formatPrice, currency } = useCurrency();

  const handleCheckout = () => {
    // Allow both authenticated and guest users to checkout
    navigate('/checkout');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Shopping Cart</h2>
                <span className="bg-secondary px-2 py-0.5 rounded-full text-xs font-medium">{cartCount}</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-primary-light rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-grow overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                  <ShoppingCart className="w-16 h-16 mb-4" />
                  <p className="text-lg font-semibold">Your cart is empty</p>
                  <p className="text-sm">Add some products to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const product = item.product;
                    const productId = product._id || product.id;
                    
                    return (
                      <motion.div
                        key={productId}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="bg-neutral-50 rounded-lg p-3 flex space-x-3 border border-neutral-200"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                                                  <div className="flex-grow">
                            <h3 className="font-semibold text-sm text-neutral-800 line-clamp-1">{product.name}</h3>
                            <p className="text-secondary font-bold text-base">{formatPrice(product.price)}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              onClick={() => updateQuantity(productId, item.quantity - 1)}
                              className="bg-white p-1 rounded border border-neutral-300 hover:bg-neutral-100 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-medium text-sm w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(productId, item.quantity + 1)}
                              className="bg-white p-1 rounded border border-neutral-300 hover:bg-neutral-100 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeFromCart(productId)}
                              className="ml-auto text-secondary hover:bg-secondary/10 p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-neutral-200 p-4 space-y-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
    <span className="text-neutral-700">Total:</span>
    <span className="text-primary">{formatPrice(totalPrice)} <span className="text-sm text-neutral-500">({currency})</span></span>
  </div>
                <motion.button 
                  onClick={handleCheckout}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 8px 20px rgba(233, 69, 96, 0.3)" 
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-secondary to-secondary-dark text-white py-3.5 rounded-lg font-bold shadow-md hover:shadow-xl transition-all duration-200"
                >
                  Proceed to Checkout
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;