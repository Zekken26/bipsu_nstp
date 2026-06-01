import { Router } from 'express';
import { authenticateRequest, requireRole } from '../../middleware/authGuard.js';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createFollowController } from './follows.controller.js';

const router = Router();

router.post('/', authenticateRequest(), requireRole('admin', 'facilitator', 'student'), strictWriteLimiter, asyncHandler(createFollowController));

export default router;
