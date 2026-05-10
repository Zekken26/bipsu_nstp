import { Router } from 'express';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createFollowController } from './follows.controller.js';

const router = Router();

router.post('/', strictWriteLimiter, asyncHandler(createFollowController));

export default router;
