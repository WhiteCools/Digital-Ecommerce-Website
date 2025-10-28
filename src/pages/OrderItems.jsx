import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Key, Copy, Eye, EyeOff, CheckCircle, ArrowLeft, Lock, Gift, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const OrderItems = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleItems, setVisibleItems] = useState({});
  const [copiedItems, setCopiedItems] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrderItems();
  }, [orderId, isAuthenticated, navigate]);

  const fetchOrderItems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/digital-orders/${orderId}/items`);
      setOrderData(data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order items');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = (itemId) => {
    setVisibleItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const copyToClipboard = async (content, itemId) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedItems((prev) => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setCopiedItems((prev) => ({ ...prev, [itemId]: false }));
      }, 2000);
          } catch (err) {
        // Failed to copy
      }
  };

  const maskContent = (content) => {
    if (content.includes(':')) {
      // Email:Password format
      const [email, password] = content.split(':');
      return `${email}:${'•'.repeat(password.length)}`;
    }
    // Key/Code format
    if (content.length > 10) {
      return content.substring(0, 4) + '•'.repeat(content.length - 8) + content.substring(content.length - 4);
    }
    return '•'.repeat(content.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">Access Denied</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary-dark transition-colors"
          >
            Back to Orders
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center space-x-2 text-neutral-600 hover:text-secondary mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Orders</span>
          </button>

          {/* Security Notice */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-8">
            <div className="flex items-start space-x-3">
              <Lock className="w-6 h-6 text-yellow-600 mt-1" />
              <div>
                <h3 className="font-bold text-yellow-900 mb-2">🔒 Security Notice</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Your items are encrypted and secure</li>
                  <li>• DO NOT share these items with anyone</li>
                  <li>• Screenshot at your own risk</li>
                  <li>• Contact support if you have issues</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-primary">Your Order Items</h1>
                <p className="text-neutral-600 text-sm">
                  Order ID: <span className="font-mono">{orderId.slice(-8).toUpperCase()}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-600">Order Date</p>
                <p className="font-semibold text-neutral-800">
                  {new Date(orderData.orderDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-6">
            {orderData.items.map((product, productIndex) => (
              <motion.div
                key={productIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: productIndex * 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                {/* Product Header */}
                <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.productName}
                          className="w-16 h-16 object-cover rounded-lg border-2 border-white/30"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                      )}
                      <div>
                        <h2 className="text-xl font-bold">{product.productName}</h2>
                        <p className="text-white/80 text-sm capitalize">
                          Type: {product.productType} • Quantity: {product.quantity}
                        </p>
                      </div>
                    </div>
                    <Gift className="w-8 h-8" />
                  </div>
                </div>

                {/* Delivery Instructions */}
                {product.deliveryInstructions && (
                  <div className="px-6 pt-6 pb-3 bg-blue-50 border-b border-blue-100">
                    <p className="text-sm text-blue-800">
                      <strong>📋 Instructions:</strong> {product.deliveryInstructions}
                    </p>
                  </div>
                )}

                {/* Items */}
                <div className="p-6 space-y-4">
                  {product.items && product.items.length > 0 ? product.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: itemIndex * 0.1 }}
                      className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg p-5 border-2 border-neutral-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Key className="w-5 h-5 text-secondary" />
                          <span className="font-semibold text-neutral-800">
                            Item #{itemIndex + 1}
                          </span>
                          {item.viewed && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              ✓ Viewed
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-neutral-500">
                          Delivered: {new Date(item.deliveredAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Content Display */}
                      <div className="bg-white rounded-lg p-4 border border-neutral-300 mb-3">
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-mono text-neutral-800 break-all flex-1">
                            {visibleItems[item.id]
                              ? item.content
                              : maskContent(item.content)}
                          </code>
                          <div className="flex items-center space-x-2 ml-4">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleVisibility(item.id)}
                              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                              title={visibleItems[item.id] ? 'Hide' : 'Show'}
                            >
                              {visibleItems[item.id] ? (
                                <EyeOff className="w-5 h-5 text-neutral-600" />
                              ) : (
                                <Eye className="w-5 h-5 text-neutral-600" />
                              )}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => copyToClipboard(item.content, item.id)}
                              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                              title="Copy"
                            >
                              {copiedItems[item.id] ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Copy className="w-5 h-5 text-neutral-600" />
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </div>

                      {/* Copy Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => copyToClipboard(item.content, item.id)}
                        className="w-full bg-secondary text-white py-2 rounded-lg font-semibold hover:bg-secondary-dark transition-colors flex items-center justify-center space-x-2"
                      >
                        {copiedItems[item.id] ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            <span>Copy to Clipboard</span>
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                      <p className="text-neutral-600">No items available. Please contact support.</p>
                    </div>
                  )}
                </div>

                {/* Warranty Info */}
                {product.warranty > 0 && (
                  <div className="px-6 pb-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-green-800">
                        <strong>✓ Warranty:</strong> {product.warranty} days guarantee. Contact
                        support if you have any issues.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Support Notice */}
          <div className="mt-8 bg-white rounded-xl shadow-md p-6 text-center">
            <h3 className="font-bold text-neutral-800 mb-2">Need Help?</h3>
            <p className="text-neutral-600 text-sm mb-4">
              If you encounter any issues with your purchase, please contact our support team.
            </p>
            <button className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
              Contact Support
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderItems;