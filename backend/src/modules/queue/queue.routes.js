import { Router } from 'express';
import { authenticateRequest, requireRole } from '../../middleware/authGuard.js';
import { dashboardLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getQueueJob, getQueueStatus } from './queue.controller.js';

const router = Router();

router.get('/status', authenticateRequest(), requireRole('admin'), dashboardLimiter, asyncHandler(getQueueStatus));
router.get('/jobs/:id', authenticateRequest(), requireRole('admin', 'facilitator', 'student'), dashboardLimiter, asyncHandler(getQueueJob));

export default router;
