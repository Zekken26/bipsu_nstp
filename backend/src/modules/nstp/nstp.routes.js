import { Router } from 'express';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { batchUpsertNstpCollectionRecords, getAdminSummaryController, listNstpCollection, upsertNstpCollectionRecord } from './nstp.controller.js';

const router = Router();

router.get('/summary/admin', asyncHandler(getAdminSummaryController));
router.get('/:collection', asyncHandler(listNstpCollection));
router.post('/:collection', strictWriteLimiter, asyncHandler(upsertNstpCollectionRecord));
router.post('/batch/:collection', strictWriteLimiter, asyncHandler(batchUpsertNstpCollectionRecords));

export default router;
