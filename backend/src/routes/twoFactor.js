import express from 'express';
import {
  setup2FA,
  verify2FA,
  disable2FA,
  validate2FAToken,
  get2FAStatus,
} from '../controllers/twoFactorController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// 2FA management routes
router.get('/status', get2FAStatus);
router.post('/setup', setup2FA);
router.post('/verify', verify2FA);
router.post('/disable', disable2FA);
router.post('/validate', validate2FAToken);

export default router;