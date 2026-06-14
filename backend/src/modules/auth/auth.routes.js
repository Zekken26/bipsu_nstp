import { Router } from 'express';
import { authenticateRequest } from '../../middleware/authGuard.js';
import { authLimiter, registrationLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getAuthStatus, loginController, logoutController, meController, registerController } from './auth.controller.js';

const router = Router();

router.get('/status', authLimiter, asyncHandler(getAuthStatus));
router.post('/login', authLimiter, asyncHandler(loginController));
router.post('/register', registrationLimiter, asyncHandler(registerController));
router.get('/me', authenticateRequest(), asyncHandler(meController));
router.post('/logout', authenticateRequest({ optional: true }), asyncHandler(logoutController));

export default router;
