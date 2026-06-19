import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getAuthStatus, handleRegister, handleLogin } from './auth.controller.js';

const router = Router();

router.get('/status', asyncHandler(getAuthStatus));
router.post('/register', asyncHandler(handleRegister));
router.post('/login', asyncHandler(handleLogin));

export default router;
