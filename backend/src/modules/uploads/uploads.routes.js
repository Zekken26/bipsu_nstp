import { Router } from 'express';
import { authenticateRequest, enforceActiveMunicipalityScope, requireRole, requireStudentOwnership } from '../../middleware/authGuard.js';
import { preventDuplicateSubmissions } from '../../middleware/idempotency.js';
import { uploadLimiter } from '../../middleware/rateLimit.js';
import { validateUploadMetadata } from '../../middleware/uploadValidation.js';
import { queueRequest } from '../../queue/requestQueue.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createUploadIntent, getUploadPolicy } from './uploads.controller.js';

const router = Router();

router.get('/policy', getUploadPolicy);
router.post(
  '/',
  authenticateRequest(),
  enforceActiveMunicipalityScope,
  requireRole('admin', 'facilitator', 'student'),
  requireStudentOwnership({ bodyField: 'ownerId' }),
  uploadLimiter,
  preventDuplicateSubmissions({ keyPrefix: 'upload-intent', windowMs: 30_000 }),
  validateUploadMetadata,
  queueRequest('fileUploads'),
  asyncHandler(createUploadIntent)
);

export default router;
