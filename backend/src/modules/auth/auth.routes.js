import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../../middleware/validationSchemas.js';
import { getAuthStatus, handleRegister, handleLogin, handleGetProfile, handleUpdateProfile } from './auth.controller.js';

const router = Router();

router.get('/status', asyncHandler(getAuthStatus));
router.post('/register', authLimiter, validateRequest(registerSchema), asyncHandler(handleRegister));
router.post('/login', authLimiter, validateRequest(loginSchema), asyncHandler(handleLogin));
router.get('/me', authenticate, asyncHandler(handleGetProfile));
router.put('/me', authenticate, validateRequest(updateProfileSchema), asyncHandler(handleUpdateProfile));

export default router;
