import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, Calendar, DollarSign, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Orders = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch both physical and digital orders
      const [physicalOrders, digitalOrders] = await Promise.all([
        api.get('/orders/myorders').catch(() => ({ data: { data: [] } })),
        api.get('/digital-orders/myorders').catch(() => ({ data: { data: [] } })),
      ]);
      
      // Combine and mark order types
      const allOrders = [
        ...physicalOrders.data.data.map(order => ({ ...order, orderType: 'physical' })),
        ...digitalOrders.data.data.map(order => ({ ...order, orderType: 'digital' })),
      ];
      
      // Sort by date
      allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setOrders(allOrders);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Shipped':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'Processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'Cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-neutral-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">My Orders</h1>
            <p className="text-neutral-600">Track and manage your orders</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Orders List */}
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-md p-12 text-center"
            >
              <Package className="w-20 h-20 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">No Orders Yet</h2>
              <p className="text-neutral-600 mb-6">Start shopping to see your orders here!</p>
              <button
                onClick={() => navigate('/')}
                className="bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-secondary-dark transition-colors"
              >
                Start Shopping
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {orders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm opacity-90 mb-1">Order ID</p>
                        <p className="font-mono font-semibold text-lg">#{order._id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className={`px-4 py-2 rounded-full border font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-6">
                    {/* Order Info Grid */}
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-secondary mt-1" />
                        <div>
                          <p className="text-sm text-neutral-500">Order Date</p>
                          <p className="font-semibold text-neutral-800">
                            {new Date(order.createdAt).toLocaleDateString('en-MY', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <DollarSign className="w-5 h-5 text-secondary mt-1" />
                        <div>
                          <p className="text-sm text-neutral-500">Total Amount</p>
                          <p className="font-bold text-secondary text-lg">
                            ${order.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {order.orderType === 'physical' && order.shippingAddress && (
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-secondary mt-1" />
                          <div>
                            <p className="text-sm text-neutral-500">Delivery Address</p>
                            <p className="font-semibold text-neutral-800 text-sm">
                              {order.shippingAddress.street}, {order.shippingAddress.city}
                            </p>
                          </div>
                        </div>
                      )}
                      {order.orderType === 'digital' && (
                        <div className="flex items-start space-x-3">
                          <Package className="w-5 h-5 text-secondary mt-1" />
                          <div>
                            <p className="text-sm text-neutral-500">Delivery Type</p>
                            <p className="font-semibold text-purple-600 text-sm">
                              ⚡ Instant Digital Delivery
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-center space-x-2 mb-6 p-4 bg-neutral-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-neutral-600">Payment Status</p>
                        <p className="font-semibold text-neutral-800">{order.paymentMethod}</p>
                      </div>
                      <div>
                        {order.isPaid ? (
                          <span className="flex items-center space-x-2 text-green-600 font-semibold">
                            <CheckCircle className="w-5 h-5" />
                            <span>Paid</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-2 text-yellow-600 font-semibold">
                            <Clock className="w-5 h-5" />
                            <span>Pending</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order Type Badge */}
                    {order.orderType === 'digital' && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-purple-600" />
                          <span className="font-semibold text-purple-900">🎮 Digital Order - Instant Delivery</span>
                        </div>
                        <button
                          onClick={() => navigate(`/order-items/${order._id}`)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm"
                        >
                          🎁 View Items
                        </button>
                      </div>
                    )}

                    {/* Order Items */}
                    <div>
                      <h3 className="font-semibold text-neutral-800 mb-4">
                        Order Items ({order.orderItems.length})
                        {order.orderType === 'digital' && (
                          <span className="text-sm text-purple-600 ml-2">(Digital Products)</span>
                        )}
                      </h3>
                      <div className="space-y-3">
                        {order.orderItems.map((item) => (
                          <div key={item._id} className="flex items-center space-x-4 p-4 bg-neutral-50 rounded-lg">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-neutral-800">{item.name}</h4>
                              <p className="text-sm text-neutral-600">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-secondary">${item.price.toFixed(2)}</p>
                              <p className="text-sm text-neutral-500">each</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="mt-6 pt-6 border-t border-neutral-200">
                      <div className="space-y-2 max-w-md ml-auto">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Subtotal</span>
                          <span className="font-medium">${order.itemsPrice.toFixed(2)}</span>
                        </div>
                        {order.orderType === 'physical' && order.shippingPrice > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-600">Shipping</span>
                            <span className="font-medium">${order.shippingPrice.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Tax</span>
                          <span className="font-medium">${order.taxPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-neutral-200 pt-2">
                          <span className="text-primary">Total</span>
                          <span className="text-secondary">${order.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Orders;