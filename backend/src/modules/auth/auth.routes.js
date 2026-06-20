import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { registerSchema, loginSchema } from '../../middleware/validationSchemas.js';
import { getAuthStatus, handleRegister, handleLogin } from './auth.controller.js';

const router = Router();

router.get('/status', asyncHandler(getAuthStatus));
router.post('/register', authLimiter, validateRequest(registerSchema), asyncHandler(handleRegister));
router.post('/login', authLimiter, validateRequest(loginSchema), asyncHandler(handleLogin));

export default router;
