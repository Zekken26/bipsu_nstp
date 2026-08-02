import { Router } from 'express';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, requireRole } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createPaymentSchema } from '../../middleware/validationSchemas.js';
import { chargePaymentController } from './payments.controller.js';

const router = Router();

router.post('/charge', authenticate, requireRole('STUDENT'), strictWriteLimiter, validateRequest(createPaymentSchema), asyncHandler(chargePaymentController));

export default router;
