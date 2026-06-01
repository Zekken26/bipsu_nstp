import { Router } from 'express';
import { authenticateRequest, enforceActiveMunicipalityScope, requireRole } from '../../middleware/authGuard.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listGradesController } from './grades.controller.js';

const router = Router();

router.get('/', authenticateRequest(), enforceActiveMunicipalityScope, requireRole('admin', 'facilitator', 'student'), asyncHandler(listGradesController));

export default router;
