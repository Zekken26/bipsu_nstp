import { Router } from 'express';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { nstpBatchSchema } from '../../middleware/validationSchemas.js';
import { batchUpsertNstpCollectionRecords, deleteNstpCollectionRecord, getAdminSummaryController, listNstpCollection, upsertNstpCollectionRecord } from './nstp.controller.js';

const router = Router();

router.get('/summary/admin', asyncHandler(getAdminSummaryController));
router.get('/:collection', asyncHandler(listNstpCollection));
router.post('/:collection', strictWriteLimiter, asyncHandler(upsertNstpCollectionRecord));
router.post('/batch/:collection', strictWriteLimiter, validateRequest(nstpBatchSchema), asyncHandler(batchUpsertNstpCollectionRecords));
router.delete('/:collection/:id', strictWriteLimiter, asyncHandler(deleteNstpCollectionRecord));

export default router;
