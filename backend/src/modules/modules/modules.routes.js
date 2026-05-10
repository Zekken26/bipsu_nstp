import { Router } from 'express';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getModuleController, listModulesController, updateModuleController } from './modules.controller.js';

const router = Router();

router.get('/', asyncHandler(listModulesController));
router.get('/:id', asyncHandler(getModuleController));
router.put('/:id', strictWriteLimiter, asyncHandler(updateModuleController));

export default router;
