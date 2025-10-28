import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToastContext } from './context/ToastContext';
import { CurrencyProvider } from './context/CurrencyContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import DigitalStore from './pages/DigitalStore';
import OrderItems from './pages/OrderItems';
import TwoFactorSetup from './pages/TwoFactorSetup';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import ToastContainer from './components/ToastContainer';
import { ShoppingCart } from 'lucide-react';
import { useCart } from './context/CartContext';
import { useToast } from './hooks/useToast';

function AppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { cart, cartCount } = useCart();
  const { toasts, removeToast } = useToastContext();

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-light to-accent">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-white border-t-secondary rounded-full mx-auto mb-4"
          />
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
                          className="text-2xl font-bold text-white"
            >
                              DigitalCommerce
            </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/80 text-sm mt-2"
          >
            Loading amazing products...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      <Navbar cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<DigitalStore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/2fa-setup" element={<TwoFactorSetup />} />
          <Route path="/order-items/:orderId" element={<OrderItems />} />
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      <AnimatePresence>
        {cart.length > 0 && (
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 10px 30px rgba(233, 69, 96, 0.4)"
            }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 bg-gradient-to-br from-secondary to-secondary-dark text-white p-4 rounded-full shadow-xl z-40 md:hidden"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              <ShoppingCart className="w-6 h-6" />
            </motion.div>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg"
            >
              {cartCount}
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </motion.div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <CurrencyProvider>
            <AuthProvider>
              <CartProvider>
                <AppContent />
              </CartProvider>
            </AuthProvider>
          </CurrencyProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
