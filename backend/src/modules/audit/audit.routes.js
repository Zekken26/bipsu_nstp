import { Router } from 'express';
import { authenticateRequest, requireRole } from '../../middleware/authGuard.js';
import { dashboardLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listAuditLogController } from './audit.controller.js';

const router = Router();

router.get('/', authenticateRequest(), requireRole('admin'), dashboardLimiter, asyncHandler(listAuditLogController));

export default router;
