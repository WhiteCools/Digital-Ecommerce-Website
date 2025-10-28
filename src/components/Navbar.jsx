import { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, User, LogOut, Package, UserCircle, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CurrencySelector from './CurrencySelector';

const Navbar = ({ cartCount = 0, onCartClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Detect scroll untuk navbar shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Navbar height offset
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
      setIsMenuOpen(false);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-200 ${
      scrolled 
        ? 'bg-white/98 dark:bg-gray-900/98 backdrop-blur-sm shadow-sm' 
        : 'bg-white dark:bg-gray-900'
    } border-b border-gray-200 dark:border-gray-800`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center space-x-2.5 cursor-pointer group">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-md flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                <ShoppingCart className="w-4 h-4 text-white dark:text-black" />
              </div>
              <div className="flex flex-col">
                                  <span className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                    DigitalCommerce
                  </span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400 tracking-wide uppercase">Digital Store</span>
              </div>
            </div>
          </Link>

          {/* Desktop Menu - EMPTY (Digital store is home) */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Navigation removed - digital store is main page */}
          </div>

          {/* Right Side Icons */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Currency Selector */}
            <CurrencySelector />
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 text-gray-600 dark:text-gray-400"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {isAuthenticated && (
              <>
                <Link to="/orders">
                  <button
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 text-gray-600 dark:text-gray-400"
                    title="My Orders"
                  >
                    <Package className="w-5 h-5" />
                  </button>
                </Link>
                <Link to="/profile">
                  <button
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 text-gray-600 dark:text-gray-400"
                    title="My Profile"
                  >
                    <UserCircle className="w-5 h-5" />
                  </button>
                </Link>
              </>
            )}
            
            <button
              onClick={onCartClick}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 relative text-gray-600 dark:text-gray-400"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md transition-colors duration-150 font-medium text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            ) : (
              <Link to="/login">
                <button className="flex items-center space-x-1.5 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md transition-colors duration-150 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium text-sm">
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-gray-700 dark:text-gray-300"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-4 space-y-2">
              {/* Mobile Currency & Theme */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</span>
                <div className="flex items-center space-x-2">
                  <CurrencySelector />
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150 text-gray-600 dark:text-gray-400"
                    title="Toggle theme"
                  >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {isAuthenticated && (
                <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Link to="/orders" onClick={toggleMenu}>
                    <button className="w-full flex items-center space-x-2 text-left py-3 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 font-medium">
                      <Package className="w-5 h-5" />
                      <span>My Orders</span>
                    </button>
                  </Link>
                  <Link to="/profile" onClick={toggleMenu}>
                    <button className="w-full flex items-center space-x-2 text-left py-3 px-4 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 font-medium">
                      <UserCircle className="w-5 h-5" />
                      <span>My Profile</span>
                    </button>
                  </Link>
                </div>
              )}
              
              <div className="flex space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => {
                    onCartClick();
                    toggleMenu();
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg transition-colors duration-200"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Cart ({cartCount})</span>
                </button>
                
                {isAuthenticated ? (
                  <button 
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                ) : (
                  <Link to="/login" className="flex-1" onClick={toggleMenu}>
                    <button className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors duration-200">
                      <User className="w-5 h-5" />
                      <span>Login</span>
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;