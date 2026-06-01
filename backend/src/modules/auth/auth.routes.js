import { Router } from 'express';
import { authLimiter, registrationLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authNotImplemented, getAuthStatus } from './auth.controller.js';

const router = Router();

router.get('/status', authLimiter, asyncHandler(getAuthStatus));
router.post('/login', authLimiter, asyncHandler(authNotImplemented));
router.post('/register', registrationLimiter, asyncHandler(authNotImplemented));

export default router;
