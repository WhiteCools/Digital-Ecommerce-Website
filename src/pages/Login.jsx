import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import TwoFactorModal from '../components/TwoFactorModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ email, password });
    
    if (result.success) {
      // Check if 2FA is required
      if (result.requiresTwoFactor) {
        setPendingToken(result.pendingToken);
        setShow2FAModal(true);
        setLoading(false);
      } else {
        navigate('/');
      }
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  const handle2FAVerify = async (code) => {
    try {
      setTwoFactorError('');
      
      // Call login again with 2FA token and pending token
      const result = await login({ 
        email, 
        password, 
        twoFactorToken: code,
        pendingToken: pendingToken
      });

      if (result.success && !result.requiresTwoFactor) {
        setShow2FAModal(false);
        navigate('/');
      } else {
        throw new Error(result.message || 'Invalid 2FA code');
      }
    } catch (error) {
      setTwoFactorError(error.message || 'Verification failed');
      throw error;
    }
  };

  const handle2FAClose = () => {
    setShow2FAModal(false);
    setTwoFactorError('');
    setPendingToken('');
  };

  return (
    <>
      <TwoFactorModal
        isOpen={show2FAModal}
        onClose={handle2FAClose}
        onVerify={handle2FAVerify}
        loading={loading}
        error={twoFactorError}
      />
      
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

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="bg-gradient-to-br from-secondary to-secondary-dark p-3 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
                          <div>
                <h1 className="text-2xl font-bold text-primary">DigitalCommerce</h1>
                <p className="text-xs text-neutral-500">Welcome back!</p>
              </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-primary mb-2">Login to Your Account</h2>
            <p className="text-neutral-600">Enter your credentials to continue</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-neutral-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-secondary hover:text-secondary-dark">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-secondary to-secondary-dark text-white py-3.5 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </motion.button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                          <p className="text-xs font-semibold text-neutral-700 mb-2">Demo Accounts:</p>
              <div className="space-y-1 text-xs text-neutral-600">
                <p><strong>Admin:</strong> admin@example.com / admin123</p>
                <p><strong>User:</strong> user@example.com / password123</p>
              </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-secondary font-semibold hover:text-secondary-dark">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
    </>
  );
};

export default Login;