import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getStudents } from './students.controller.js';

const router = Router();

router.get('/', asyncHandler(getStudents));

export default router;
