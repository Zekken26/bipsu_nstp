import { Router } from 'express';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getAdminSummaryController, listNstpCollection, upsertNstpCollectionRecord } from './nstp.controller.js';

const router = Router();

router.get('/summary/admin', asyncHandler(getAdminSummaryController));
router.get('/:collection', asyncHandler(listNstpCollection));
router.post('/:collection', strictWriteLimiter, asyncHandler(upsertNstpCollectionRecord));

export default router;
