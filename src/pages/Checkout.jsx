import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShoppingCart, CreditCard, MapPin, User, Mail, Phone, ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../services/api';

// Stripe publishable key
const stripePromise = loadStripe('pk_test_51QSWOOQP2OKRL6Zh4FbmsfXxr7dPXn6TVSZXMuWcrz2EJaAE5iswJCqcM5WILBcWWgExfkSvnYLtNUNO9KJHOt1Y00e2Lq4aZH');

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { formatPrice, currency } = useCurrency();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  // Cart validation will happen on backend when creating payment intent
  // No need to validate on frontend - reduces API calls and improves UX

  const [shippingInfo, setShippingInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || 'Malaysia',
  });
  
  // Guest registration fields (only shown if not authenticated)
  const [guestPassword, setGuestPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const taxPrice = totalPrice * 0.06; // 6% tax
  const finalTotal = totalPrice + taxPrice; // No shipping for digital products

  const handleInputChange = (e) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate guest registration if not authenticated
    if (!isAuthenticated) {
      if (!guestPassword || !confirmPassword) {
        setError('Please provide a password to create your account');
        return;
      }
      if (guestPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (guestPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (paymentMethod === 'card') {
        // Stripe payment
        if (!stripe || !elements) {
          setError('Stripe not loaded');
          setLoading(false);
          return;
        }

        // 🔒 SECURE: Send order items for server-side validation (DIGITAL)
        const endpoint = isAuthenticated 
          ? '/digital-orders/create-payment-intent'
          : '/digital-orders/guest/create-payment-intent';
        
        const requestData = {
          orderItems: cart.map(item => {
            const productId = item.product._id || item.product.id;
            console.log('📦 Sending order item:', {
              productId,
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price
            });
            return {
              product: productId,
              name: item.product.name,
              quantity: item.quantity,
              price: item.product.price, // Server will ignore this and use DB price
            };
          }),
        };
        
        // Add guest details if not authenticated
        if (!isAuthenticated) {
          requestData.guestEmail = shippingInfo.email;
          requestData.guestName = shippingInfo.name;
        }
        
        const { data } = await api.post(endpoint, requestData);

        // Verify amounts match server calculation
        if (data.validatedAmounts) {
          const serverTotal = data.validatedAmounts.totalPrice;
          const clientTotal = finalTotal;
          const difference = Math.abs(serverTotal - clientTotal);
          
                      if (difference > 0.01) {
              setError('Price verification failed. Please refresh and try again.');
            setLoading(false);
            return;
          }
        }

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardElement),
              billing_details: {
                name: shippingInfo.name,
                email: shippingInfo.email,
              },
            },
          }
        );

        if (stripeError) {
          setError(stripeError.message);
          setLoading(false);
          return;
        }

        if (paymentIntent.status === 'succeeded') {
          // Create order
          await createOrder('Card', paymentIntent.id);
        }
      } else {
        // Cash on Delivery
        await createOrder('Cash on Delivery', null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const createOrder = async (paymentMethodType, paymentId) => {
    try {
      const orderData = {
        orderItems: cart.map(item => ({
          product: item.product._id || item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          image: item.product.image,
          price: item.product.price,
        })),
        contactEmail: shippingInfo.email, // Digital products only need email
        paymentMethod: paymentMethodType,
        paymentResult: paymentId ? {
          id: paymentId,
          status: 'completed',
        } : undefined,
        itemsPrice: totalPrice,
        taxPrice: taxPrice,
        totalPrice: finalTotal,
      };
      
      // Add guest registration data if not authenticated
      if (!isAuthenticated) {
        orderData.guestName = shippingInfo.name;
        orderData.guestEmail = shippingInfo.email;
        orderData.guestPassword = guestPassword;
        orderData.shippingAddress = {
          street: shippingInfo.street || 'N/A',
          city: shippingInfo.city || 'N/A',
          state: shippingInfo.state || 'N/A',
          zipCode: shippingInfo.zipCode || '00000',
          country: shippingInfo.country || 'Malaysia',
        };
      }
      
      const endpoint = isAuthenticated ? '/digital-orders' : '/digital-orders/guest';
      const { data } = await api.post(endpoint, orderData);
      
      // If guest order, store token for auto-login
      if (!isAuthenticated && data.data.token) {
                  localStorage.setItem('token', data.data.token);
          localStorage.setItem('user', JSON.stringify(data.data.user));
        }
      
      // Clear cart
      await clearCart();
      
      setSuccess(true);
      setLoading(false);
      
      // Redirect to success page after 2 seconds
      setTimeout(() => {
        if (!isAuthenticated) {
          // Reload to update auth state
          window.location.href = '/orders';
        } else {
          navigate('/orders');
        }
      }, 2000);
    } catch (err) {
      throw err;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-3xl font-bold text-primary mb-2">🎉 Order Successful!</h2>
          {!isAuthenticated && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-semibold">✨ Account Created!</p>
              <p className="text-xs text-blue-700 mt-1">You can now login with your email and password</p>
            </div>
          )}
          <p className="text-neutral-600 mb-4">Your digital products are ready!</p>
          <p className="text-sm text-purple-600 font-semibold mb-2">✨ Instant Delivery - Check your orders now!</p>
          <p className="text-sm text-neutral-500">Redirecting to orders page...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-neutral-600 hover:text-secondary mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Shopping</span>
        </button>

        <h1 className="text-3xl font-bold text-primary mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information - No Shipping for Digital Products */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <User className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold text-primary">
                    {isAuthenticated ? 'Contact Information' : 'Create Account & Checkout'}
                  </h2>
                </div>
                {!isAuthenticated && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">🎉 <strong>Account will be created automatically</strong> after successful payment!</p>
                  </div>
                )}
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">💎 <strong>Digital Products</strong> - Instant delivery! No shipping required.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={shippingInfo.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={shippingInfo.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Password fields for guest users */}
                {!isAuthenticated && (
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-secondary" />
                      Create Your Password
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Password *
                        </label>
                        <input
                          type="password"
                          value={guestPassword}
                          onChange={(e) => setGuestPassword(e.target.value)}
                          required={!isAuthenticated}
                          placeholder="Min. 6 characters"
                          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Confirm Password *
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required={!isAuthenticated}
                          placeholder="Confirm password"
                          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      💡 You'll use this email and password to login after your purchase
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <CreditCard className="w-5 h-5 text-secondary" />
                  <h2 className="text-xl font-semibold text-primary">Payment Method</h2>
                </div>

                <div className="space-y-4">
                  {/* Card Payment */}
                  <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-secondary"
                    />
                    <CreditCard className="w-5 h-5 text-neutral-600" />
                    <span className="font-medium">Credit/Debit Card (Stripe)</span>
                  </label>

                  {paymentMethod === 'card' && (
                    <div className="pl-12 pr-4 pb-4">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#424770',
                              '::placeholder': {
                                color: '#aab7c4',
                              },
                            },
                            invalid: {
                              color: '#9e2146',
                            },
                          },
                        }}
                        className="p-4 border border-neutral-300 rounded-lg"
                      />
                    </div>
                  )}

                  {/* No COD for digital products - Card only */}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || !stripe}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-secondary to-secondary-dark text-white py-4 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : `Pay $${finalTotal.toFixed(2)}`}
              </motion.button>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-primary mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product._id || item.product.id} className="flex space-x-3">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-neutral-800 line-clamp-1">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-neutral-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold text-secondary">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-neutral-200 pt-4 space-y-2">
                {/* Currency Notice */}
                {currency !== 'USD' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-800 font-semibold">💡 Currency Conversion</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Prices displayed in {currency}. Payment processed in USD.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tax (6%)</span>
                  <span className="font-medium">{formatPrice(taxPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span className="font-medium">💎 Digital Delivery</span>
                  <span className="font-bold">FREE!</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-neutral-200 pt-2">
                  <span className="text-primary">Total</span>
                  <span className="text-purple-600">{formatPrice(finalTotal)} <span className="text-sm text-neutral-500">({currency})</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Checkout = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
};

export default Checkout;