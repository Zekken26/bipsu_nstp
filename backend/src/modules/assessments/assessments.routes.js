import { Router } from 'express';
import { authenticateRequest, requireRole, requireStudentOwnership } from '../../middleware/authGuard.js';
import { preventDuplicateSubmissions } from '../../middleware/idempotency.js';
import { assessmentSubmissionLimiter } from '../../middleware/rateLimit.js';
import { queueRequest } from '../../queue/requestQueue.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listAssessmentsController, submitAssessmentController } from './assessments.controller.js';

const router = Router();

router.get('/', asyncHandler(listAssessmentsController));
router.post(
  '/submissions',
  authenticateRequest(),
  requireRole('student'),
  requireStudentOwnership({ bodyField: 'studentId' }),
  assessmentSubmissionLimiter,
  preventDuplicateSubmissions({ keyPrefix: 'assessment-submission', windowMs: 30_000 }),
  queueRequest('assessmentSubmissions'),
  asyncHandler(submitAssessmentController)
);

export default router;
