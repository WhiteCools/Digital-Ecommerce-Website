import express from 'express';
import {
  createPaymentIntent,
  createDigitalOrder,
  createGuestPaymentIntent,
  createGuestDigitalOrder,
  getMyDigitalOrders,
  getDigitalOrderById,
  getOrderItems,
  getAllDigitalOrders,
} from '../controllers/digitalOrderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// 🛒 PUBLIC GUEST ROUTES (No authentication required)
router.post('/guest/create-payment-intent', createGuestPaymentIntent);
router.post('/guest', createGuestDigitalOrder);

// Protected routes
router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/', protect, createDigitalOrder);
router.get('/myorders', protect, getMyDigitalOrders);
router.get('/:id', protect, getDigitalOrderById);
router.get('/:id/items', protect, getOrderItems); // 🎁 Get decrypted keys/accounts

// Admin routes
router.get('/', protect, authorize('admin'), getAllDigitalOrders);

export default router;