import express from 'express';
import {
  getDashboardStats,
  getAllProducts,
  getAllDigitalProducts,
  getAllDigitalOrders,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getSystemLogs,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { adminSecurityCheck, preventSelfModification } from '../middleware/adminSecurity.js';

const router = express.Router();

// 🔒 ALL ROUTES REQUIRE ADMIN AUTHENTICATION
router.use(protect);                    // Layer 1: Check authentication
router.use(authorize('admin'));         // Layer 2: Check admin role
router.use(adminSecurityCheck);         // Layer 3: Enhanced security checks

// 📊 Dashboard & Statistics
router.get('/stats', getDashboardStats);

// 📦 Product Management
router.get('/products', getAllProducts);
router.get('/digital-products', getAllDigitalProducts);

// 🛍️ Order Management
router.get('/digital-orders', getAllDigitalOrders);

// 👥 User Management
router.get('/users', getAllUsers);
router.put('/users/:id/role', preventSelfModification, updateUserRole);
router.put('/users/:id/status', preventSelfModification, toggleUserStatus);
router.delete('/users/:id', preventSelfModification, deleteUser);

// 📋 System Logs (Future feature)
router.get('/logs', getSystemLogs);

export default router;