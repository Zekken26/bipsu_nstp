import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/authenticate.js';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { rejectProhibitedCredentialFields, validateRequest } from '../../middleware/validateRequest.js';
import { nstpBatchSchema } from '../../middleware/validationSchemas.js';
import {
  getCurrentCoordinator, getCurrentInstructor, getCurrentStudent,
  requireAssignedSection, requireStudentInAssignedSection,
} from './nstp.authorization.js';
import {
  adminAccounts, adminAssessments, adminAttendanceRecords, adminAttendanceSessions,
  adminAuditLog, adminComponentState, adminGrades, adminModules,
  adminPendingRegistrations, adminQualifyingResults, adminStudents, adminTrainingGroups,
  createInstructorGrade, getAdminSummaryController, getMyAttendance, getMyGrades,
  getMyQualifyingResults, getMyStudentProfile, listCoordinatorClasses,
  listCoordinatorStudents, listInstructorClasses, listInstructorClassStudents,
} from './nstp.controller.js';

const router = Router();
const admin = [authenticate, requireRole('ADMIN')];

function adminResource(path, handlers) {
  router.get(`/admin/${path}`, ...admin, asyncHandler(handlers.list));
  router.post(`/admin/${path}`, ...admin, strictWriteLimiter, rejectProhibitedCredentialFields, asyncHandler(handlers.upsert));
  router.post(`/admin/${path}/batch`, ...admin, strictWriteLimiter, rejectProhibitedCredentialFields, validateRequest(nstpBatchSchema), asyncHandler(handlers.batch));
  router.delete(`/admin/${path}/:id`, ...admin, strictWriteLimiter, asyncHandler(handlers.remove));
}

// Administrative resources are intentionally explicit: clients cannot select a
// model/collection through a URL parameter.
adminResource('accounts', adminAccounts);
adminResource('students', adminStudents);
adminResource('modules', adminModules);
adminResource('assessments', adminAssessments);
adminResource('grades', adminGrades);
adminResource('pending-registrations', adminPendingRegistrations);
adminResource('training-groups', adminTrainingGroups);
adminResource('attendance-records', adminAttendanceRecords);
adminResource('attendance-sessions', adminAttendanceSessions);
adminResource('qualifying-results', adminQualifyingResults);
adminResource('component-state', adminComponentState);
adminResource('audit-log', adminAuditLog);
router.get('/admin/summary', ...admin, asyncHandler(getAdminSummaryController));

router.get('/students/me', authenticate, requireRole('STUDENT'), asyncHandler(getCurrentStudent), asyncHandler(getMyStudentProfile));
router.get('/students/me/grades', authenticate, requireRole('STUDENT'), asyncHandler(getCurrentStudent), asyncHandler(getMyGrades));
router.get('/students/me/attendance', authenticate, requireRole('STUDENT'), asyncHandler(getCurrentStudent), asyncHandler(getMyAttendance));
router.get('/students/me/qualifying-results', authenticate, requireRole('STUDENT'), asyncHandler(getMyQualifyingResults));

router.get('/instructors/classes', authenticate, requireRole('INSTRUCTOR'), asyncHandler(getCurrentInstructor), asyncHandler(listInstructorClasses));
router.get('/instructors/classes/:classId/students', authenticate, requireRole('INSTRUCTOR'), asyncHandler(getCurrentInstructor), asyncHandler(requireAssignedSection), asyncHandler(listInstructorClassStudents));
router.post('/instructors/classes/:classId/grades', authenticate, requireRole('INSTRUCTOR'), strictWriteLimiter, asyncHandler(getCurrentInstructor), asyncHandler(requireAssignedSection), asyncHandler(requireStudentInAssignedSection), asyncHandler(createInstructorGrade));

router.get('/coordinators/component/students', authenticate, requireRole('COORDINATOR'), asyncHandler(getCurrentCoordinator), asyncHandler(listCoordinatorStudents));
router.get('/coordinators/component/classes', authenticate, requireRole('COORDINATOR'), asyncHandler(getCurrentCoordinator), asyncHandler(listCoordinatorClasses));

export default router;
