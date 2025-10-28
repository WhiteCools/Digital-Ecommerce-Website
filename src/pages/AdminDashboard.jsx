import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Package,
  Users,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Activity,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Star,
  Calendar,
  Mail,
  Phone,
  MapPin,
  FileText,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToastContext } from '../context/ToastContext';
import { validateAdminToken } from '../utils/adminValidator';
import AddDigitalProductModal from '../components/admin/AddDigitalProductModal';
import ManageInventoryModal from '../components/admin/ManageInventoryModal';
import EditProductModal from '../components/admin/EditProductModal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, checkAuth } = useAuth();
  const toast = useToastContext();
  const [loading, setLoading] = useState(true);
  const [authVerified, setAuthVerified] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [digitalProducts, setDigitalProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [digitalOrders, setDigitalOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // 🔒 CRITICAL SECURITY: Multi-layer admin verification (RUNS ONCE ON MOUNT)
  useEffect(() => {
    const verifyAdminAccess = async () => {
      // Layer 1: Validate token exists and structure
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('🚨 SECURITY: No token found');
        toast.error('Please login to continue.');
        navigate('/login', { replace: true });
        return;
      }

      if (!validateAdminToken(token)) {
        console.error('🚨 SECURITY: Invalid token structure');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Invalid session. Please login again.');
        navigate('/login', { replace: true });
        return;
      }

      // Layer 2: Check authentication state
      if (!isAuthenticated) {
        console.error('🚨 UNAUTHORIZED: Not authenticated');
        toast.error('Please login to continue.');
        navigate('/login', { replace: true });
        return;
      }

      // Layer 3: Check user exists and has admin role
      if (!user || user.role !== 'admin') {
        console.error('🚨 FORBIDDEN: Non-admin access attempt');
        console.error('   User:', user);
        console.error('   Timestamp:', new Date().toISOString());
        toast.error('Access denied. Administrator privileges required.');
        navigate('/', { replace: true });
        return;
      }

      // Layer 4: Verify and load data (without calling checkAuth to prevent loop)
      console.log('✅ Admin access verified');
      setAuthVerified(true);
      loadDashboardData();
    };

    // Only run on mount
    verifyAdminAccess();
  }, []); // ✅ Empty deps - only run once

  // 🔒 Prevent rendering if not verified
  useEffect(() => {
    if (!authVerified && !loading) {
      console.warn('⚠️ Auth not verified, blocking render');
    }
  }, [authVerified, loading]);

  // 🔒 SECURITY: Periodic token validation (every 5 minutes - less aggressive)
  useEffect(() => {
    if (!authVerified) return;

    const validateSession = () => {
      const token = localStorage.getItem('token');
      if (!token || !validateAdminToken(token)) {
        console.error('🚨 SESSION INVALID: Logging out');
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      }
    };

    // Check every 5 minutes instead of 30 seconds
    const interval = setInterval(validateSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authVerified]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [
        statsRes,
        productsRes,
        digitalProductsRes,
        ordersRes,
        digitalOrdersRes,
        usersRes,
      ] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/products'),
        api.get('/admin/digital-products'),
        api.get('/orders'), // Admin gets all orders
        api.get('/admin/digital-orders'),
        api.get('/admin/users'),
      ]);

      setStats(statsRes.data.data);
      setProducts(productsRes.data.data);
      setDigitalProducts(digitalProductsRes.data.data);
      setOrders(ordersRes.data.data);
      setDigitalOrders(digitalOrdersRes.data.data);
      setUsers(usersRes.data.data);
    } catch (error) {
      // Don't show error for rate limiting
      if (error.response?.status === 429 || error.silent) {
        console.warn('Rate limit hit, will retry automatically');
      } else {
        toast.error(error.response?.data?.message || 'Failed to load dashboard data');
      }
      
      // If unauthorized, redirect
      if (error.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  const handleDeleteDigitalProduct = async (productId, productName) => {
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This will mark it as inactive.`)) {
      return;
    }

    setDeletingProduct(productId);
    
    // ✅ OPTIMISTIC UPDATE: Mark as inactive immediately
    const originalProduct = digitalProducts.find(p => p._id === productId);
    setDigitalProducts(prevProducts => 
      prevProducts.map(p => 
        p._id === productId 
          ? { ...p, isActive: false }
          : p
      )
    );

    try {
      await api.delete(`/digital-products/${productId}`);
      toast.success(`"${productName}" has been deleted`);
    } catch (error) {
      // ❌ ROLLBACK: Restore original state on error
      setDigitalProducts(prevProducts => 
        prevProducts.map(p => 
          p._id === productId 
            ? originalProduct
            : p
        )
      );
      
      // Don't show error toast for rate limiting
      if (error.response?.status !== 429 && !error.silent) {
        toast.error(error.response?.data?.message || 'Failed to delete product');
      }
    } finally {
      setDeletingProduct(null);
    }
  };

  const handleToggleProductStatus = async (productId, shouldActivate) => {
    const product = digitalProducts.find(p => p._id === productId);
    if (!product) {
      toast.error('Product not found');
      return;
    }

    // Determine new status based on shouldActivate flag
    const newStatus = shouldActivate;
    const currentStatus = product.isActive !== false;
    
    console.log('🔄 Toggling Product Status:', {
      productId: productId.slice(-6),
      productName: product.name,
      currentStatusInDB: product.isActive,
      normalizedCurrentStatus: currentStatus,
      shouldActivate,
      newStatus,
      willBe: newStatus ? 'ACTIVE ✅' : 'INACTIVE ❌'
    });
    
    // ✅ OPTIMISTIC UPDATE: Update UI immediately for better UX
    const previousProducts = [...digitalProducts];
    setDigitalProducts(prevProducts => 
      prevProducts.map(p => 
        p._id === productId 
          ? { ...p, isActive: newStatus }
          : p
      )
    );
    
    try {
      const response = await api.put(`/digital-products/${productId}`, {
        isActive: newStatus
      });
      
      console.log('✅ Status updated successfully:', response.data);
      
      // Show success message
      if (newStatus) {
        toast.success(`"${product.name}" is now active and visible to customers!`);
      } else {
        toast.error(`"${product.name}" has been deactivated and hidden from store`);
      }

      // Refresh data to ensure everything is in sync
      setTimeout(() => {
        loadDashboardData();
      }, 500);
    } catch (error) {
      console.error('❌ Failed to update status:', error);
      
      // ❌ ROLLBACK: Revert to previous state on error
      setDigitalProducts(previousProducts);
      
      // Don't show error toast for rate limiting
      if (error.response?.status !== 429 && !error.silent) {
        toast.error(error.response?.data?.message || 'Failed to update product status');
      }
    }
  };

  // 🔒 SECURITY: Block render if not verified
  if (loading || !authVerified) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-secondary rounded-full mx-auto mb-4"
          />
          <p className="text-neutral-600">
            {!authVerified ? 'Verifying admin access...' : 'Loading Admin Dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  // 🔒 FINAL CHECK: Double verify before render
  if (!isAuthenticated || !user || user.role !== 'admin') {
    console.error('🚨 CRITICAL: Unauthorized render attempt blocked');
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={() => navigate('/profile')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                aria-label="Back to Profile"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Admin Dashboard</h1>
                </div>
                <p className="text-white/80 text-xs sm:text-sm mt-1">Complete control & management</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-1 sm:space-x-2 bg-white/10 hover:bg-white/20 px-3 sm:px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
              aria-label="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline text-sm">Refresh</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
            <StatCard
              icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />}
              label="Total Revenue"
              value={`$${stats?.totalRevenue?.toFixed(2) || '0.00'}`}
              trend="+12.5%"
            />
            <StatCard
              icon={<ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />}
              label="Total Orders"
              value={stats?.totalOrders || 0}
              trend="+8.2%"
            />
            <StatCard
              icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
              label="Total Users"
              value={stats?.totalUsers || 0}
              trend="+15.3%"
            />
            <StatCard
              icon={<Package className="w-5 h-5 sm:w-6 sm:h-6" />}
              label="Total Products"
              value={(stats?.totalProducts || 0) + (stats?.totalDigitalProducts || 0)}
              trend="+5.0%"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-neutral-200 overflow-x-auto scrollbar-hide">
            <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6" aria-label="Tabs">
              <TabButton
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                icon={<Activity className="w-5 h-5" />}
                label="Overview"
              />
              <TabButton
                active={activeTab === 'products'}
                onClick={() => setActiveTab('products')}
                icon={<Package className="w-5 h-5" />}
                label="Physical Products"
                badge={products.length}
              />
              <TabButton
                active={activeTab === 'digital'}
                onClick={() => setActiveTab('digital')}
                icon={<Lock className="w-5 h-5" />}
                label="Digital Products"
                badge={digitalProducts.length}
              />
              <TabButton
                active={activeTab === 'orders'}
                onClick={() => setActiveTab('orders')}
                icon={<ShoppingBag className="w-5 h-5" />}
                label="Orders"
                badge={orders.length + digitalOrders.length}
              />
              <TabButton
                active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
                icon={<Users className="w-5 h-5" />}
                label="Users"
                badge={users.length}
              />
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <OverviewTab
                stats={stats}
                recentOrders={[...orders, ...digitalOrders]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 10)}
              />
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <ProductsTab
                products={products}
                onRefresh={loadDashboardData}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            )}

            {/* Digital Products Tab */}
            {activeTab === 'digital' && (
              <DigitalProductsTab
                products={digitalProducts}
                onRefresh={loadDashboardData}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                showInactive={showInactive}
                setShowInactive={setShowInactive}
                onAddProduct={() => setShowAddProductModal(true)}
                onEditProduct={(product) => {
                  setSelectedProduct(product);
                  setShowEditProductModal(true);
                }}
                onManageInventory={(product) => {
                  setSelectedProduct(product);
                  setShowInventoryModal(true);
                }}
                onDeleteProduct={handleDeleteDigitalProduct}
                onToggleStatus={handleToggleProductStatus}
                deletingProduct={deletingProduct}
              />
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <OrdersTab
                orders={[...orders, ...digitalOrders]}
                onRefresh={loadDashboardData}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
              />
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <UsersTab
                users={users}
                onRefresh={loadDashboardData}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddDigitalProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onSuccess={loadDashboardData}
      />

      <ManageInventoryModal
        isOpen={showInventoryModal}
        onClose={() => {
          setShowInventoryModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSuccess={loadDashboardData}
      />

      <EditProductModal
        isOpen={showEditProductModal}
        onClose={() => {
          setShowEditProductModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, label, value, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 hover:bg-white/20 transition-all"
  >
    <div className="flex items-center justify-between mb-2">
      <div className="text-white/80">{icon}</div>
      <span className="text-green-300 text-xs sm:text-sm font-semibold">{trend}</span>
    </div>
    <p className="text-xl sm:text-2xl font-bold text-white truncate">{value}</p>
    <p className="text-white/80 text-xs sm:text-sm mt-1">{label}</p>
  </motion.div>
);

const TabButton = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap
      ${active
        ? 'border-primary text-primary'
        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
      }
    `}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="hidden sm:inline">{label}</span>
    <span className="sm:hidden">{label.split(' ')[0]}</span>
    {badge !== undefined && (
      <span className={`
        px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-semibold
        ${active ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-600'}
      `}>
        {badge}
      </span>
    )}
  </button>
);

// Tab Components (Placeholder - akan dibuat dalam file berasingan)
const OverviewTab = ({ stats, recentOrders }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6">Dashboard Overview</h2>
      
      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-500 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-green-700 font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-green-900">${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
          <p className="text-xs text-green-600 mt-1">+12.5% from last month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-blue-700 font-medium">Total Orders</p>
          <p className="text-2xl font-bold text-blue-900">{stats?.totalOrders || 0}</p>
          <p className="text-xs text-blue-600 mt-1">{stats?.pendingOrders || 0} pending</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-sm text-purple-700 font-medium">Total Products</p>
          <p className="text-2xl font-bold text-purple-900">{(stats?.totalProducts || 0) + (stats?.totalDigitalProducts || 0)}</p>
          <p className="text-xs text-purple-600 mt-1">{stats?.lowStockItems || 0} low stock</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border border-orange-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-sm text-orange-700 font-medium">Total Users</p>
          <p className="text-2xl font-bold text-orange-900">{stats?.totalUsers || 0}</p>
          <p className="text-xs text-orange-600 mt-1">+15.3% growth</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-neutral-800">Recent Orders</h3>
            <Activity className="w-5 h-5 text-neutral-400" />
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">{order.orderType === 'digital' ? '💎' : '📦'}</div>
                    <div>
                      <p className="font-medium text-sm">Order #{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(order.createdAt).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">${order.totalPrice?.toFixed(2)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Statistics */}
        <div className="bg-white rounded-lg border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-neutral-800">System Statistics</h3>
            <Zap className="w-5 h-5 text-neutral-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-neutral-700 font-medium">Pending Orders</span>
              </div>
              <span className="font-bold text-xl text-yellow-600">{stats?.pendingOrders || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-neutral-700 font-medium">Active Products</span>
              </div>
              <span className="font-bold text-xl text-green-600">{stats?.activeProducts || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-neutral-700 font-medium">Low Stock Items</span>
              </div>
              <span className="font-bold text-xl text-red-600">{stats?.lowStockItems || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-neutral-700 font-medium">Active Users</span>
              </div>
              <span className="font-bold text-xl text-blue-600">{stats?.activeUsers || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-5">
        <h3 className="font-bold text-lg text-neutral-800 mb-4">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button className="flex items-center space-x-2 bg-white border border-neutral-200 p-3 rounded-lg hover:shadow-md transition-all">
            <Plus className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Add Product</span>
          </button>
          <button className="flex items-center space-x-2 bg-white border border-neutral-200 p-3 rounded-lg hover:shadow-md transition-all">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">View Orders</span>
          </button>
          <button className="flex items-center space-x-2 bg-white border border-neutral-200 p-3 rounded-lg hover:shadow-md transition-all">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Manage Users</span>
          </button>
          <button className="flex items-center space-x-2 bg-white border border-neutral-200 p-3 rounded-lg hover:shadow-md transition-all">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Generate Report</span>
          </button>
        </div>
      </div>
    </div>
);
};

const ProductsTab = ({ products, onRefresh, searchTerm, setSearchTerm }) => {
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">Physical Products</h2>
          <p className="text-sm text-neutral-600 mt-1">{filteredProducts.length} products available</p>
        </div>
        <button
          onClick={() => window.location.href = '/admin/products/new'}
          className="flex items-center space-x-2 bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by name or category..."
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-600 mb-2">No products found</p>
          <p className="text-sm text-neutral-500">
            {searchTerm ? `No results for "${searchTerm}"` : 'Add your first product to get started'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Product</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Stock</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Rating</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        <div>
                          <p className="font-medium text-neutral-800">{product.name}</p>
                          <p className="text-sm text-neutral-500">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-primary">${product.price?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${
                        product.stock === 0 ? 'text-red-600' :
                        product.stock < 10 ? 'text-orange-600' : 
                        'text-green-600'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
                        <span className="text-xs text-neutral-500">({product.numReviews || 0})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.isActive ? 'Active' : 'Inactive'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-neutral-200 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3 mb-3">
                  <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-neutral-800 mb-1">{product.name}</h3>
                    <p className="text-sm text-neutral-600 mb-2">{product.brand}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {product.category}
                      </span>
                      <StatusBadge status={product.isActive ? 'Active' : 'Inactive'} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3 p-3 bg-neutral-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-neutral-500">Price</p>
                    <p className="text-sm font-bold text-primary">${product.price?.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-neutral-500">Stock</p>
                    <p className={`text-sm font-bold ${
                      product.stock === 0 ? 'text-red-600' :
                      product.stock < 10 ? 'text-orange-600' : 
                      'text-green-600'
                    }`}>
                      {product.stock}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-neutral-500">Rating</p>
                    <div className="flex items-center justify-center space-x-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold">{product.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 flex items-center justify-center space-x-2 bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors">
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
);
};

const DigitalProductsTab = ({ products, onRefresh, searchTerm, setSearchTerm, showInactive, setShowInactive, onAddProduct, onEditProduct, onManageInventory, onDeleteProduct, onToggleStatus, deletingProduct }) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Digital Products</h2>
        <p className="text-sm text-neutral-600 mt-1">
          {(() => {
            const activeCount = products.filter(p => p.isActive !== false).length;
            const inactiveCount = products.filter(p => p.isActive === false).length;
            const total = products.length;
            return showInactive 
              ? `Showing all ${total} products (${activeCount} active, ${inactiveCount} inactive)`
              : `Showing ${activeCount} active products (${inactiveCount} hidden)`;
          })()}
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
            showInactive 
              ? 'border-purple-600 bg-purple-50 text-purple-600'
              : 'border-neutral-300 text-neutral-600 hover:border-purple-600'
          }`}
        >
          {showInactive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          <span>{showInactive ? 'Show Active Only' : 'Show All'}</span>
        </button>
        <button
          onClick={onAddProduct}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Digital Product</span>
        </button>
      </div>
    </div>

    {/* Search */}
    <div className="mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search digital products..."
          className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
    </div>

    {/* Products Grid */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products
        .filter(p => {
          // Filter by search term
          const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
          // Filter by active status
          const matchesStatus = showInactive ? true : p.isActive !== false;
          return matchesSearch && matchesStatus;
        })
        .map((product) => (
          <div key={product._id} className={`bg-white border-2 rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
            product.isActive === false ? 'border-red-300 opacity-75' : 'border-neutral-200'
          }`}>
            <div className="relative">
              <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                {product.featured && (
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                    ⭐ Featured
                  </span>
                )}
                {!product.isActive && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    ❌ Inactive
                  </span>
                )}
                {product.isActive && (product.inventoryStats?.available || 0) === 0 && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    ⚠️ No Stock
                  </span>
                )}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-neutral-600 mb-2">{product.category}</p>
                </div>
                {product.isActive === false && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-primary mb-3">RM {product.price?.toFixed(2)}</p>
              
              {/* Inventory Stats */}
              <div className="bg-neutral-50 rounded-lg p-3 mb-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-neutral-600">Total</p>
                    <p className="text-sm font-bold">{product.inventoryStats?.total || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600">Available</p>
                    <p className="text-sm font-bold text-green-600">{product.inventoryStats?.available || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600">Sold</p>
                    <p className="text-sm font-bold text-blue-600">{product.inventoryStats?.sold || 0}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                {product.isActive !== false ? (
                  <>
                    <button
                      onClick={() => onEditProduct(product)}
                      disabled={deletingProduct === product._id}
                      className="flex-1 flex items-center justify-center space-x-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
                      title="Edit Product"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onManageInventory(product)}
                      disabled={deletingProduct === product._id}
                      className="flex-1 flex items-center justify-center space-x-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
                    >
                      <Package className="w-4 h-4" />
                      <span>Stock</span>
                    </button>
                    <button 
                      onClick={() => {
                        console.log('🔘 Deactivate clicked:', product.name, 'Current isActive:', product.isActive);
                        onToggleStatus(product._id, false); // Set to inactive
                      }}
                      disabled={deletingProduct === product._id}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Deactivate Product"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteProduct(product._id, product.name)}
                      disabled={deletingProduct === product._id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Product"
                    >
                      {deletingProduct === product._id ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"
                        />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        console.log('🔘 Activate clicked:', product.name, 'Current isActive:', product.isActive);
                        onToggleStatus(product._id, true); // Set to active
                      }}
                      disabled={deletingProduct === product._id}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Activate</span>
                    </button>
                    <button 
                      onClick={() => onDeleteProduct(product._id, product.name)}
                      disabled={deletingProduct === product._id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Permanently Delete"
                    >
                      {deletingProduct === product._id ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"
                        />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
    </div>

    {(() => {
      const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = showInactive ? true : p.isActive !== false;
        return matchesSearch && matchesStatus;
      });
      
      if (filteredProducts.length === 0) {
        if (products.length === 0) {
          return (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600 mb-4">No digital products yet</p>
              <button
                onClick={onAddProduct}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Product</span>
              </button>
            </div>
          );
        } else if (searchTerm) {
          return (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600 mb-2">No products found matching "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Clear search
              </button>
            </div>
          );
        } else {
          return (
            <div className="text-center py-12">
              <EyeOff className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-600 mb-2">No active products to display</p>
              <p className="text-sm text-neutral-500 mb-4">
                {products.filter(p => p.isActive === false).length} inactive products hidden
              </p>
              <button
                onClick={() => setShowInactive(true)}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Show all products
              </button>
            </div>
          );
        }
      }
      return null;
    })()}
  </div>
);

const OrdersTab = ({ orders, filterStatus, setFilterStatus }) => {
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Shipped':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getOrderTypeIcon = (orderType) => {
    return orderType === 'digital' ? '💎' : '📦';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">All Orders</h2>
          <p className="text-sm text-neutral-600 mt-1">{filteredOrders.length} orders found</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-neutral-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-600 mb-2">No orders found</p>
          <p className="text-sm text-neutral-500">Orders will appear here once customers make purchases</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 p-4 border-b border-neutral-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getOrderTypeIcon(order.orderType)}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-mono font-bold text-neutral-800">#{order._id.slice(-8).toUpperCase()}</p>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          {order.orderType === 'digital' ? 'Digital' : 'Physical'}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">
                        {new Date(order.createdAt).toLocaleString('en-MY', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <div className="text-right">
                      <p className="text-xs text-neutral-600">Total</p>
                      <p className="text-lg font-bold text-primary">${order.totalPrice?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <Users className="w-4 h-4 text-neutral-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-neutral-500">Customer</p>
                      <p className="text-sm font-medium text-neutral-800">{order.user?.name || 'Guest'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Mail className="w-4 h-4 text-neutral-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-neutral-500">Email</p>
                      <p className="text-sm font-medium text-neutral-800 truncate">{order.contactEmail || order.user?.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Package className="w-4 h-4 text-neutral-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-neutral-500">Items</p>
                      <p className="text-sm font-medium text-neutral-800">{order.orderItems?.length || 0} products</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <DollarSign className="w-4 h-4 text-neutral-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-neutral-500">Payment</p>
                      <div className="flex items-center space-x-1">
                        {order.isPaid ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-yellow-600" />
                        )}
                        <p className="text-sm font-medium text-neutral-800">{order.isPaid ? 'Paid' : 'Pending'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-neutral-700 mb-2">Order Items:</p>
                  <div className="space-y-2">
                    {order.orderItems?.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-3 bg-white p-2 rounded">
                        <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800 truncate">{item.name}</p>
                          <p className="text-xs text-neutral-500">Qty: {item.quantity} × ${item.price?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    {order.orderItems?.length > 2 && (
                      <p className="text-xs text-neutral-500 text-center">+ {order.orderItems.length - 2} more items</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const UsersTab = ({ users, searchTerm, setSearchTerm }) => {
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">User Management</h2>
          <p className="text-sm text-neutral-600 mt-1">{filteredUsers.length} users registered</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-600 mb-2">No users found</p>
          <p className="text-sm text-neutral-500">
            {searchTerm ? `No results for "${searchTerm}"` : 'Users will appear here once they register'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-neutral-200 rounded-lg p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-800">{user.name}</h3>
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center space-x-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        <Shield className="w-3 h-3" />
                        <span>Admin</span>
                      </span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        Customer
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Mail className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-neutral-600 break-all">{user.email}</p>
                </div>
                
                {user.phone && (
                  <div className="flex items-start space-x-2">
                    <Phone className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-neutral-600">{user.phone}</p>
                  </div>
                )}
                
                {user.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {user.address.city}, {user.address.state}
                    </p>
                  </div>
                )}
                
                <div className="flex items-start space-x-2">
                  <Calendar className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-neutral-600">
                    Joined {new Date(user.createdAt).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-neutral-50 rounded-lg p-2">
                    <p className="text-xs text-neutral-500">Orders</p>
                    <p className="text-lg font-bold text-primary">{user.orderCount || 0}</p>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-2">
                    <p className="text-xs text-neutral-500">Spent</p>
                    <p className="text-lg font-bold text-green-600">${(user.totalSpent || 0).toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    Active: 'bg-green-100 text-green-700',
    Inactive: 'bg-gray-100 text-gray-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Processing: 'bg-blue-100 text-blue-700',
    Completed: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
    Delivered: 'bg-green-100 text-green-700',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

const StatRow = ({ label, value, color }) => {
  const colors = {
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  };

  return (
    <div className="flex items-center justify-between bg-white p-3 rounded-lg">
      <span className="text-neutral-700">{label}</span>
      <span className={`font-bold text-lg ${colors[color]}`}>{value}</span>
    </div>
  );
};

export default AdminDashboard;