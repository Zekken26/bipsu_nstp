import { Router } from 'express';
import { authenticateRequest, enforceActiveMunicipalityScope, requireRole } from '../../middleware/authGuard.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getStudents } from './students.controller.js';

const router = Router();

router.get('/', authenticateRequest(), enforceActiveMunicipalityScope, requireRole('admin', 'facilitator'), asyncHandler(getStudents));

export default router;
