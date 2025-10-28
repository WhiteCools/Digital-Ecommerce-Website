import express from 'express';
import {
  getDigitalProducts,
  getDigitalProduct,
  createDigitalProduct,
  updateDigitalProduct,
  deleteDigitalProduct,
  addInventoryItems,
  getProductInventory,
  getCategories,
} from '../controllers/digitalProductController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getDigitalProducts);
router.get('/categories/list', getCategories);
router.get('/:id', getDigitalProduct);

// Admin routes
router.post('/', protect, authorize('admin'), createDigitalProduct);
router.put('/:id', protect, authorize('admin'), updateDigitalProduct);
router.delete('/:id', protect, authorize('admin'), deleteDigitalProduct);
router.post('/:id/inventory', protect, authorize('admin'), addInventoryItems);
router.get('/:id/inventory', protect, authorize('admin'), getProductInventory);

export default router;