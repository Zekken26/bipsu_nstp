import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listGradesController } from './grades.controller.js';

const router = Router();

router.get('/', asyncHandler(listGradesController));

export default router;
