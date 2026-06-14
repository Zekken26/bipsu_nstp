import { Router } from 'express';
import { authenticateRequest, enforceActiveMunicipalityScope, requireRole } from '../../middleware/authGuard.js';
import { preventDuplicateSubmissions } from '../../middleware/idempotency.js';
import { assessmentSubmissionLimiter, exportLimiter, registrationLimiter, strictWriteLimiter } from '../../middleware/rateLimit.js';
import { queueRequest } from '../../queue/requestQueue.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createNstpExportJob, downloadNstpExport, getAdminSummaryController, listNstpCollection, upsertNstpCollectionRecord } from './nstp.controller.js';

const router = Router();

const writeLimiters = {
  accounts: registrationLimiter,
  assessments: assessmentSubmissionLimiter,
  grades: assessmentSubmissionLimiter,
  supportTickets: strictWriteLimiter,
};

const queueNames = {
  assessments: 'assessmentSubmissions',
  grades: 'batchGrading',
  supportTickets: 'emailNotifications',
};

const collectionReadRoles = {
  accounts: ['admin'],
  modules: ['admin', 'facilitator', 'student'],
  assessments: ['admin', 'facilitator', 'student'],
  students: ['admin', 'facilitator'],
  grades: ['admin', 'facilitator', 'student'],
  notices: ['admin', 'facilitator', 'student'],
  supportTickets: ['admin'],
};

const collectionWriteRoles = {
  accounts: ['admin'],
  modules: ['admin', 'facilitator'],
  assessments: ['admin', 'facilitator'],
  students: ['admin'],
  grades: ['admin', 'facilitator'],
  notices: ['admin', 'facilitator'],
  supportTickets: ['admin', 'facilitator', 'student'],
};

function collectionLimiter(req, res, next) {
  const limiter = writeLimiters[req.params.collection] || strictWriteLimiter;
  return limiter(req, res, next);
}

function collectionQueue(req, res, next) {
  const queueName = queueNames[req.params.collection];
  if (!queueName) return next();
  return queueRequest(queueName)(req, res, next);
}

function requireCollectionRead(req, res, next) {
  return requireRole(...(collectionReadRoles[req.params.collection] || ['admin']))(req, res, next);
}

function requireCollectionWrite(req, res, next) {
  return requireRole(...(collectionWriteRoles[req.params.collection] || ['admin']))(req, res, next);
}

router.get('/summary/admin', authenticateRequest(), requireRole('admin'), asyncHandler(getAdminSummaryController));
router.get('/exports/:collection', authenticateRequest(), enforceActiveMunicipalityScope, requireCollectionRead, exportLimiter, asyncHandler(downloadNstpExport));
router.post('/exports/:collection', authenticateRequest(), enforceActiveMunicipalityScope, requireRole('admin', 'facilitator'), requireCollectionRead, exportLimiter, queueRequest('reportExports'), preventDuplicateSubmissions({ keyPrefix: 'exports', windowMs: 60_000 }), asyncHandler(createNstpExportJob));
router.get('/:collection', authenticateRequest(), enforceActiveMunicipalityScope, requireCollectionRead, asyncHandler(listNstpCollection));
router.post(
  '/:collection',
  authenticateRequest(),
  enforceActiveMunicipalityScope,
  requireCollectionWrite,
  collectionLimiter,
  preventDuplicateSubmissions({ keyPrefix: 'nstp-write', windowMs: 20_000 }),
  collectionQueue,
  asyncHandler(upsertNstpCollectionRecord)
);

export default router;
