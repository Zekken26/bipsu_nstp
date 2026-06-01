import { Router } from 'express';
import { authenticateRequest, requireRole } from '../../middleware/authGuard.js';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { chargePaymentController } from './payments.controller.js';

const router = Router();

router.post('/charge', authenticateRequest(), requireRole('admin'), strictWriteLimiter, asyncHandler(chargePaymentController));

export default router;
