import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/authenticate.js';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  activateTemplate, createTemplateDraft, duplicateTemplate,
  listTemplates, publishTemplate, recordExportEvent, removeTemplateDraft,
} from './profileTemplates.controller.js';
import { createProfileTemplateSchema, profileExportEventSchema, profileTemplateIdSchema } from './profileTemplates.validation.js';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));
router.get('/', asyncHandler(listTemplates));
router.post('/', strictWriteLimiter, validateRequest(createProfileTemplateSchema), asyncHandler(createTemplateDraft));
router.post('/export-events', strictWriteLimiter, validateRequest(profileExportEventSchema), asyncHandler(recordExportEvent));
router.post('/:id/publish', strictWriteLimiter, validateRequest(profileTemplateIdSchema), asyncHandler(publishTemplate));
router.post('/:id/activate', strictWriteLimiter, validateRequest(profileTemplateIdSchema), asyncHandler(activateTemplate));
router.post('/:id/duplicate', strictWriteLimiter, validateRequest(profileTemplateIdSchema), asyncHandler(duplicateTemplate));
router.delete('/:id', strictWriteLimiter, validateRequest(profileTemplateIdSchema), asyncHandler(removeTemplateDraft));

export default router;
