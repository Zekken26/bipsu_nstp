import { sendSuccess } from '../../utils/apiResponse.js';
import {
  createSemesterGrade, holdSemesterGrade, listAdminGradeRoster, listAdminSemesterGrades,
  listCoordinatorSemesterGrades, listInstructorGradeRoster, listReleasedStudentSemesterGrades,
  releaseSemesterGrade, saveInstructorSemesterGrade, updateSemesterGrade,
} from './grades.service.js';

export async function listAdminGrades(req, res) {
  const result = await listAdminSemesterGrades(req.validated.query);
  return sendSuccess(res, result.records, 200, result.pagination);
}
export async function listAdminRoster(req, res) {
  const result = await listAdminGradeRoster(req.validated.query);
  return sendSuccess(res, result.records, 200, result.pagination);
}
export async function createAdminGrade(req, res) { return sendSuccess(res, await createSemesterGrade(req.user.id, req.validated.body), 201); }
export async function updateAdminGrade(req, res) { return sendSuccess(res, await updateSemesterGrade(req.user.id, req.params.id, req.validated.body)); }
export async function releaseAdminGrade(req, res) { return sendSuccess(res, await releaseSemesterGrade(req.user.id, req.params.id)); }
export async function holdAdminGrade(req, res) { return sendSuccess(res, await holdSemesterGrade(req.user.id, req.params.id)); }
export async function saveInstructorGrade(req, res) { return sendSuccess(res, await saveInstructorSemesterGrade(req.user.id, req.instructor, req.section, req.validated.body), 201); }
export async function listInstructorRoster(req, res) {
  const result = await listInstructorGradeRoster(req.section, req.validated.query);
  return sendSuccess(res, result.records, 200, result.pagination);
}
export async function listCoordinatorGrades(req, res) {
  const result = await listCoordinatorSemesterGrades(req.coordinator.allowedComponentIds, req.validated.query);
  return sendSuccess(res, result.records, 200, result.pagination);
}
export async function listMyReleasedGrades(req, res) { return sendSuccess(res, await listReleasedStudentSemesterGrades(req.student.id)); }
