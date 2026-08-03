import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/authenticate.js';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getCurrentCoordinator, getCurrentInstructor, getCurrentStudent, requireAssignedSection, requireStudentInAssignedSection } from '../nstp/nstp.authorization.js';
import {
  createAdminGrade, holdAdminGrade, listAdminGrades, listAdminRoster, listCoordinatorGrades,
  listInstructorRoster, listMyReleasedGrades, releaseAdminGrade, saveInstructorGrade, updateAdminGrade,
} from './grades.controller.js';
import {
  createSemesterGradeSchema, gradeIdSchema, gradeRosterSchema, instructorSemesterGradeSchema,
  listSemesterGradesSchema, updateSemesterGradeSchema,
} from './grades.validation.js';

const router = Router();
const admin = [authenticate, requireRole('ADMIN')];

router.get('/admin/grades', ...admin, validateRequest(listSemesterGradesSchema), asyncHandler(listAdminGrades));
router.get('/admin/grade-roster', ...admin, validateRequest(gradeRosterSchema), asyncHandler(listAdminRoster));
router.post('/admin/grades', ...admin, strictWriteLimiter, validateRequest(createSemesterGradeSchema), asyncHandler(createAdminGrade));
router.patch('/admin/grades/:id', ...admin, strictWriteLimiter, validateRequest(updateSemesterGradeSchema), asyncHandler(updateAdminGrade));
router.post('/admin/grades/:id/release', ...admin, strictWriteLimiter, validateRequest(gradeIdSchema), asyncHandler(releaseAdminGrade));
router.post('/admin/grades/:id/hold', ...admin, strictWriteLimiter, validateRequest(gradeIdSchema), asyncHandler(holdAdminGrade));

router.post('/instructors/classes/:classId/grades', authenticate, requireRole('INSTRUCTOR'), strictWriteLimiter,
  asyncHandler(getCurrentInstructor), asyncHandler(requireAssignedSection), validateRequest(instructorSemesterGradeSchema),
  asyncHandler(requireStudentInAssignedSection), asyncHandler(saveInstructorGrade));
router.get('/instructors/classes/:classId/grade-roster', authenticate, requireRole('INSTRUCTOR'),
  asyncHandler(getCurrentInstructor), asyncHandler(requireAssignedSection), validateRequest(gradeRosterSchema), asyncHandler(listInstructorRoster));
router.get('/coordinators/grades', authenticate, requireRole('COORDINATOR'), asyncHandler(getCurrentCoordinator), validateRequest(listSemesterGradesSchema), asyncHandler(listCoordinatorGrades));
router.get('/students/me/grades', authenticate, requireRole('STUDENT'), asyncHandler(getCurrentStudent), asyncHandler(listMyReleasedGrades));

export default router;
