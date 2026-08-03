import prisma from '../../db/prisma.js';
import { sendError } from '../../utils/apiResponse.js';

export async function getCurrentStudent(req, res, next) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!student) return sendError(res, 'Student profile not found.', 404);
  req.student = student;
  return next();
}

export async function getCurrentInstructor(req, res, next) {
  const instructor = await prisma.instructorProfile.findUnique({
    where: { userId: req.user.id },
    include: { user: { select: { status: true } }, sections: { select: { componentId: true } } },
  });

  if (!instructor || (instructor.user?.status && instructor.user.status !== 'ACTIVE')) return sendError(res, 'Instructor account is not active.', 403);
  req.instructor = instructor;
  return next();
}

export async function getCurrentCoordinator(req, res, next) {
  const coordinator = await prisma.coordinatorProfile.findUnique({
    where: { userId: req.user.id },
    include: { user: { select: { status: true } } },
  });

  if (!coordinator || (coordinator.user?.status && coordinator.user.status !== 'ACTIVE')) return sendError(res, 'Coordinator account is not active.', 403);
  if (!coordinator.scope && coordinator.componentId) {
    req.coordinator = { ...coordinator, allowedComponentIds: [coordinator.componentId], allowedComponentTypes: [] };
    return next();
  }
  const scopeTypes = coordinator.scope === 'MTS' ? ['MTS_ARMY', 'MTS_NAVY']
    : coordinator.scope === 'LTS' ? ['LTS'] : ['CWTS', 'CWTS_COAST_GUARD'];
  const components = await prisma.nSTPComponent.findMany({ where: { type: { in: scopeTypes } }, select: { id: true, type: true } });
  if (components.length !== scopeTypes.length) return sendError(res, 'Coordinator component scope is not fully configured.', 403);
  req.coordinator = { ...coordinator, allowedComponentIds: components.map((component) => component.id), allowedComponentTypes: scopeTypes };
  return next();
}

export async function requireAssignedSection(req, res, next) {
  const section = await prisma.section.findUnique({ where: { id: req.params.classId } });
  if (!section) return sendError(res, 'Class not found.', 404);
  if (section.instructorId !== req.instructor.id) {
    return sendError(res, 'You are not assigned to this class.', 403);
  }
  req.section = section;
  return next();
}

export async function requireStudentInAssignedSection(req, res, next) {
  const student = await prisma.studentProfile.findUnique({ where: { id: req.body.studentId } });
  if (!student) return sendError(res, 'Student not found.', 404);
  if (student.sectionId !== req.section.id) {
    return sendError(res, 'Student is not enrolled in this class.', 403);
  }
  req.targetStudent = student;
  return next();
}
