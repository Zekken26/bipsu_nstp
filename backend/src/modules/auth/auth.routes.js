import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getAuthStatus } from './auth.controller.js';

const router = Router();

router.get('/status', asyncHandler(getAuthStatus));

export default router;
