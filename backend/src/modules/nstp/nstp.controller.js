import prisma from '../../db/prisma.js';
import { sendError, sendSuccess } from '../../utils/apiResponse.js';
import {
  batchUpsertAdminResources,
  deleteAdminResource,
  getAdminSummary,
  getDatabaseStatus,
  listAdminResource,
  upsertAdminResource,
} from './nstp.service.js';
import { emitCollectionChange } from '../../websocket.js';
import { studentSelfSelect, toStudentSelfProfileDto } from '../auth/user.dto.js';

const ADMIN_RESOURCES = new Set([
  'accounts', 'modules', 'assessments', 'students', 'grades',
  'pending-registrations', 'training-groups', 'attendance-records',
  'attendance-sessions', 'qualifying-results', 'component-state', 'audit-log',
]);

function adminResourceHandlers(resource) {
  if (!ADMIN_RESOURCES.has(resource)) throw new Error(`Unsupported resource: ${resource}`);
  return {
    list: async (req, res) => res.json(await listAdminResource(resource)),
    upsert: async (req, res) => {
      const payload = req.body || {};
      const lookup = payload.id ? { id: payload.id }
        : payload.studentId ? { studentId: payload.studentId }
          : payload.email ? { email: payload.email }
            : { id: `${resource}-${Date.now()}` };
      const record = await upsertAdminResource(resource, lookup, { ...lookup, ...payload });
      emitCollectionChange(resource, 'upserted');
      return res.status(201).json(record);
    },
    batch: async (req, res) => {
      const records = req.body;
      if (!Array.isArray(records) || records.length === 0) {
        return sendError(res, 'Expected a non-empty array of records.', 400);
      }
      const results = await batchUpsertAdminResources(resource, records);
      const failed = results.filter((entry) => entry?.error);
      emitCollectionChange(resource, 'batch-upserted');
      if (failed.length) {
        return res.status(207).json({ success: false, upserted: results.length - failed.length, failed: failed.length, errors: failed });
      }
      return sendSuccess(res, { upserted: results.length });
    },
    remove: async (req, res) => {
      const result = await deleteAdminResource(resource, req.params.id);
      if (!result) return sendError(res, 'Record not found or could not be deleted.', 404);
      emitCollectionChange(resource, 'deleted');
      return sendSuccess(res, { deleted: result.id || req.params.id });
    },
  };
}

export const adminAccounts = adminResourceHandlers('accounts');
export const adminModules = adminResourceHandlers('modules');
export const adminAssessments = adminResourceHandlers('assessments');
export const adminStudents = adminResourceHandlers('students');
export const adminGrades = adminResourceHandlers('grades');
export const adminPendingRegistrations = adminResourceHandlers('pending-registrations');
export const adminTrainingGroups = adminResourceHandlers('training-groups');
export const adminAttendanceRecords = adminResourceHandlers('attendance-records');
export const adminAttendanceSessions = adminResourceHandlers('attendance-sessions');
export const adminQualifyingResults = adminResourceHandlers('qualifying-results');
export const adminComponentState = adminResourceHandlers('component-state');
export const adminAuditLog = adminResourceHandlers('audit-log');

export async function getDbTest(req, res) {
  const status = await getDatabaseStatus();
  return res.json(status);
}

export async function getAdminSummaryController(req, res) {
  return res.json(await getAdminSummary());
}

export async function getMyStudentProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: studentSelfSelect,
  });
  return sendSuccess(res, toStudentSelfProfileDto(user));
}

export async function getMyGrades(req, res) {
  const grades = await prisma.grade.findMany({
    where: { studentId: req.student.id }, orderBy: { createdAt: 'desc' },
  });
  return sendSuccess(res, grades);
}

export async function getMyAttendance(req, res) {
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: { in: [req.student.id, req.user.id] } }, orderBy: { createdAt: 'desc' },
  });
  return sendSuccess(res, records);
}

export async function getMyQualifyingResults(req, res) {
  const results = await prisma.qualifyingExamResult.findMany({
    where: { userId: req.user.id }, orderBy: { createdAt: 'desc' },
  });
  return sendSuccess(res, results);
}

export async function listInstructorClasses(req, res) {
  const sections = await prisma.section.findMany({ where: { instructorId: req.instructor.id } });
  return sendSuccess(res, sections);
}

export async function listInstructorClassStudents(req, res) {
  const students = await prisma.studentProfile.findMany({
    where: { sectionId: req.section.id },
    include: { user: { select: { id: true, name: true, email: true, data: true } } },
  });
  return sendSuccess(res, students);
}

export async function createInstructorGrade(req, res) {
  const { studentId, ...gradeData } = req.body;
  const grade = await prisma.grade.create({ data: { ...gradeData, studentId } });
  return res.status(201).json({ success: true, data: grade });
}

export async function listCoordinatorStudents(req, res) {
  const students = await prisma.studentProfile.findMany({
    where: { componentId: req.coordinator.componentId },
    include: { user: { select: { id: true, name: true, email: true, data: true } } },
  });
  return sendSuccess(res, students);
}

export async function listCoordinatorClasses(req, res) {
  const sections = await prisma.section.findMany({ where: { componentId: req.coordinator.componentId } });
  return sendSuccess(res, sections);
}
