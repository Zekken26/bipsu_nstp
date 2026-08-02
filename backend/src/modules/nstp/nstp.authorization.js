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
  });

  if (!instructor) return sendError(res, 'Instructor profile not found.', 403);
  req.instructor = instructor;
  return next();
}

export async function getCurrentCoordinator(req, res, next) {
  const coordinator = await prisma.coordinatorProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!coordinator?.componentId) {
    return sendError(res, 'Coordinator component assignment not found.', 403);
  }
  req.coordinator = coordinator;
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
