import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, AlertCircle, ShoppingCart } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000, productImage, productName }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <ShoppingCart className="w-5 h-5 text-blue-500" />,
  };

  const backgrounds = {
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      className={`flex items-center gap-3 p-3 rounded-xl border shadow-xl backdrop-blur-sm ${backgrounds[type]} min-w-[320px]`}
    >
      {productImage && type === 'success' && (
        <div className="flex-shrink-0">
          <img 
            src={productImage} 
            alt={productName} 
            className="w-12 h-12 rounded-lg object-cover"
          />
        </div>
      )}
      
      {!productImage && (
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
      )}
      
      <div className="flex-1">
        {productName && type === 'success' && (
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">
            Added to cart
          </div>
        )}
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {message}
        </div>
      </div>
      
      {type === 'success' && !productImage && (
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
      )}
      
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default Toast;