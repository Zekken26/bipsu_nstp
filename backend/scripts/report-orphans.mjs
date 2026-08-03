import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const checks = [
  ['student_profile', 'userId', 'user'], ['student_profile', 'sectionId', 'section'], ['student_profile', 'componentId', 'nstp_component'], ['instructor_profile', 'userId', 'user'], ['instructor_profile', 'coordinatorId', 'coordinator_profile'], ['instructor_profile', 'componentId', 'nstp_component'], ['coordinator_profile', 'userId', 'user'], ['coordinator_profile', 'componentId', 'nstp_component'], ['section', 'componentId', 'nstp_component'], ['section', 'instructorId', 'instructor_profile'], ['module', 'componentId', 'nstp_component'], ['module', 'instructorId', 'instructor_profile'], ['lesson', 'moduleId', 'module'], ['quiz', 'moduleId', 'module'], ['question', 'quizId', 'quiz'], ['question', 'examId', 'exam'], ['assignment', 'moduleId', 'module'], ['exam', 'moduleId', 'module'], ['submission', 'studentId', 'student_profile'], ['submission', 'lessonId', 'lesson'], ['submission', 'quizId', 'quiz'], ['submission', 'assignmentId', 'assignment'], ['submission', 'examId', 'exam'], ['enrollment', 'studentId', 'student_profile'], ['enrollment', 'componentId', 'nstp_component'], ['enrollment', 'sectionId', 'section'], ['grade', 'studentId', 'student_profile'], ['grade', 'moduleId', 'module'], ['grade', 'quizId', 'quiz'], ['grade', 'assignmentId', 'assignment'], ['grade', 'examId', 'exam'], ['follow', 'followerId', 'user'], ['follow', 'targetUserId', 'user'], ['payment', 'userId', 'user'], ['payment', 'targetEnrollmentId', 'enrollment'],
];
const prisma = new PrismaClient();
try {
  const tables = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  const available = new Set(tables.map(({ tablename }) => tablename));
  const columns = await prisma.$queryRaw`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`;
  const availableColumns = new Set(columns.map(({ table_name, column_name }) => `${table_name}.${column_name}`));
  const findings = [];
  const warnings = [];
  const skippedChecks = [];
  for (const [child, column, parent] of checks) {
    if (!available.has(child) || !available.has(parent)) continue;
    if (!availableColumns.has(`${child}.${column}`)) {
      skippedChecks.push({ relation: `${child}.${column} -> ${parent}.id`, reason: 'Column is not present in the current schema.' });
      continue;
    }
    const sample = await prisma.$queryRawUnsafe(`SELECT c."id", c."${column}" FROM "${child}" c LEFT JOIN "${parent}" p ON p."id" = c."${column}" WHERE c."${column}" IS NOT NULL AND p."id" IS NULL ORDER BY c."id" LIMIT 100`);
    if (sample.length) findings.push({ relation: `${child}.${column} -> ${parent}.id`, count: sample.length, sample });
  }
  if (available.has('quiz')) {
    const legacyAssessmentLinks = await prisma.$queryRawUnsafe(`SELECT "id", "moduleId", "title" FROM "quiz" WHERE "moduleId" IN ('m1', 'unknown') ORDER BY "id" LIMIT 100`);
    if (legacyAssessmentLinks.length) warnings.push({
      issue: 'Assessments using legacy placeholder module IDs require administrator review.',
      sample: legacyAssessmentLinks,
    });
    const embeddedQuestionDefinitions = await prisma.$queryRawUnsafe(`SELECT q."id", q."title" FROM "quiz" q WHERE jsonb_array_length(CASE WHEN jsonb_typeof(q."data"->'questions') = 'array' THEN q."data"->'questions' ELSE '[]'::jsonb END) > 0 AND NOT EXISTS (SELECT 1 FROM "question" question_row WHERE question_row."quizId" = q."id") ORDER BY q."id" LIMIT 100`);
    if (embeddedQuestionDefinitions.length) warnings.push({
      issue: 'Legacy assessments still use embedded question definitions; editing them will migrate questions into relational rows.',
      sample: embeddedQuestionDefinitions,
    });
  }
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), findings, warnings, skippedChecks }, null, 2));
  if (findings.length) process.exitCode = 1;
} finally { await prisma.$disconnect(); }
