import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listAssessmentsController } from './assessments.controller.js';

const router = Router();

router.get('/', asyncHandler(listAssessmentsController));

export default router;
