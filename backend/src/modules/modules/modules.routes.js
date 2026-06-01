import { Router } from 'express';
import { authenticateRequest, requireRole } from '../../middleware/authGuard.js';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getModuleController, listModulesController, updateModuleController } from './modules.controller.js';

const router = Router();

router.get('/', asyncHandler(listModulesController));
router.get('/:id', asyncHandler(getModuleController));
router.put('/:id', authenticateRequest(), requireRole('admin', 'facilitator'), strictWriteLimiter, asyncHandler(updateModuleController));

export default router;
