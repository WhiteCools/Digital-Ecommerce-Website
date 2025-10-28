import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, ShoppingBag, Lock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Register = () => {


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-accent flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Back Button */}
        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 text-white mb-6 hover:text-secondary-light transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </motion.button>
        </Link>

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="bg-gradient-to-br from-secondary to-secondary-dark p-3 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
                          <div>
                <h1 className="text-2xl font-bold text-primary">DigitalCommerce</h1>
                <p className="text-xs text-neutral-500">Create your account</p>
              </div>
          </div>

          {/* Info Content */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-secondary to-secondary-dark rounded-full mb-6"
            >
              <ShoppingBag className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-primary mb-3">Buy to Register</h2>
            <p className="text-lg text-neutral-600 mb-6">
              Account registration is available only through purchase
            </p>
          </div>

          {/* How it Works */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-primary mb-4 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
              How It Works
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Browse Products</h4>
                  <p className="text-sm text-neutral-600">Explore our digital store and add items to your cart</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Checkout & Create Account</h4>
                  <p className="text-sm text-neutral-600">During checkout, provide your name, email, and password</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Complete Payment</h4>
                  <p className="text-sm text-neutral-600">Your account will be created automatically after successful payment</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-semibold text-primary">Start Shopping!</h4>
                  <p className="text-sm text-neutral-600">Login with your credentials and enjoy shopping</p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-neutral-50 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-primary mb-3 flex items-center justify-center">
              <Lock className="w-5 h-5 mr-2 text-secondary" />
              Why This Way?
            </h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Prevents spam and fake accounts</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Ensures genuine customers only</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Automatic account verification through purchase</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Seamless registration process</span>
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-secondary to-secondary-dark text-white py-4 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Start Shopping Now</span>
              </motion.button>
            </Link>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary font-semibold hover:text-secondary-dark">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;