import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const checks = [
  ['student_profile', 'userId', 'user'], ['student_profile', 'sectionId', 'section'], ['student_profile', 'componentId', 'nstp_component'], ['instructor_profile', 'userId', 'user'], ['coordinator_profile', 'userId', 'user'], ['coordinator_profile', 'componentId', 'nstp_component'], ['section', 'componentId', 'nstp_component'], ['section', 'instructorId', 'instructor_profile'], ['module', 'componentId', 'nstp_component'], ['module', 'instructorId', 'instructor_profile'], ['lesson', 'moduleId', 'module'], ['quiz', 'moduleId', 'module'], ['question', 'quizId', 'quiz'], ['question', 'examId', 'exam'], ['assignment', 'moduleId', 'module'], ['exam', 'moduleId', 'module'], ['submission', 'studentId', 'student_profile'], ['submission', 'lessonId', 'lesson'], ['submission', 'quizId', 'quiz'], ['submission', 'assignmentId', 'assignment'], ['submission', 'examId', 'exam'], ['enrollment', 'studentId', 'student_profile'], ['enrollment', 'componentId', 'nstp_component'], ['enrollment', 'sectionId', 'section'], ['grade', 'studentId', 'student_profile'], ['grade', 'moduleId', 'module'], ['grade', 'quizId', 'quiz'], ['grade', 'assignmentId', 'assignment'], ['grade', 'examId', 'exam'], ['follow', 'followerId', 'user'], ['follow', 'targetUserId', 'user'], ['payment', 'userId', 'user'], ['payment', 'targetEnrollmentId', 'enrollment'],
];
const prisma = new PrismaClient();
try {
  const tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  const available = new Set(tables.map(({ tablename }) => tablename));
  const findings = [];
  for (const [child, column, parent] of checks) {
    if (!available.has(child) || !available.has(parent)) continue;
    const sample = await prisma.$queryRawUnsafe(`SELECT c."id", c."${column}" FROM "${child}" c LEFT JOIN "${parent}" p ON p."id" = c."${column}" WHERE c."${column}" IS NOT NULL AND p."id" IS NULL ORDER BY c."id" LIMIT 100`);
    if (sample.length) findings.push({ relation: `${child}.${column} -> ${parent}.id`, count: sample.length, sample });
  }
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), findings }, null, 2));
  if (findings.length) process.exitCode = 1;
} finally { await prisma.$disconnect(); }
