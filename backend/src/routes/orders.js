import express from 'express';
import {
  createOrder,
  createGuestOrder,
  createGuestPaymentIntent,
  getOrderById,
  getMyOrders,
  getAllOrders,
  updateOrderToPaid,
  updateOrderToDelivered,
  updateOrderStatus,
  createPaymentIntent,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// 🛒 PUBLIC GUEST ROUTES (No authentication required)
// Create payment intent for guest checkout
router.post('/guest/create-payment-intent', createGuestPaymentIntent);
// Create order as guest (auto-creates account)
router.post('/guest', createGuestOrder);

// 🔒 PROTECTED ROUTES (Require authentication)
router.use(protect);

// Create payment intent (Stripe)
router.post('/create-payment-intent', createPaymentIntent);

// User routes
router.post('/', createOrder);
router.get('/myorders', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/pay', updateOrderToPaid);

// Admin routes
router.get('/', authorize('admin'), getAllOrders);
router.put('/:id/deliver', authorize('admin'), updateOrderToDelivered);
router.put('/:id/status', authorize('admin'), updateOrderStatus);

export default router;