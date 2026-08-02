import { Router } from 'express';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createFollowSchema } from '../../middleware/validationSchemas.js';
import { createFollowController, deleteFollowController } from './follows.controller.js';

const router = Router();

router.post('/', authenticate, strictWriteLimiter, validateRequest(createFollowSchema), asyncHandler(createFollowController));
router.delete('/:targetUserId', authenticate, strictWriteLimiter, asyncHandler(deleteFollowController));

export default router;
