import { z } from 'zod';

const schoolYear = z.string().regex(/^\d{4}-\d{4}$/, 'School year must use YYYY-YYYY.').refine((value) => {
  const [start, end] = value.split('-').map(Number);
  return end === start + 1;
}, 'School year must span exactly one year.');

const gradeInput = z.object({
  inputType: z.enum(['PERCENT', 'NUMERICAL']),
  inputValue: z.number().finite(),
}).strict();

export const createSemesterGradeSchema = z.object({
  body: z.object({
    studentId: z.string().trim().min(1).max(200),
    componentId: z.string().trim().min(1).max(200),
    schoolYear,
    semester: z.enum(['FIRST', 'SECOND']),
    gradeInput,
    remarks: z.string().trim().max(500).optional(),
  }).strict(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateSemesterGradeSchema = z.object({
  body: z.object({ gradeInput: gradeInput.optional(), remarks: z.string().trim().max(500).optional() }).strict()
    .refine((value) => Object.keys(value).length > 0, 'At least one grade field is required.'),
  params: z.object({ id: z.string().trim().min(1).max(200) }),
  query: z.object({}).optional(),
});

export const gradeIdSchema = z.object({
  body: z.object({}).strict().optional(),
  params: z.object({ id: z.string().trim().min(1).max(200) }),
  query: z.object({}).optional(),
});

export const listSemesterGradesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    schoolYear: schoolYear.optional(),
    semester: z.enum(['FIRST', 'SECOND']).optional(),
    componentId: z.string().trim().min(1).max(200).optional(),
    status: z.enum(['DRAFT', 'RELEASED']).optional(),
    search: z.string().trim().max(100).optional().default(''),
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
  }).strict(),
});

export const gradeRosterSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ classId: z.string().trim().min(1).max(200) }).partial().optional(),
  query: z.object({
    schoolYear,
    semester: z.enum(['FIRST', 'SECOND']),
    componentId: z.string().trim().min(1).max(200).optional(),
    status: z.enum(['DRAFT', 'RELEASED']).optional(),
    search: z.string().trim().max(100).optional().default(''),
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
  }).strict(),
});

export const instructorSemesterGradeSchema = z.object({
  body: z.object({
    studentId: z.string().trim().min(1).max(200),
    schoolYear,
    semester: z.enum(['FIRST', 'SECOND']),
    gradeInput,
    remarks: z.string().trim().max(500).optional(),
  }).strict(),
  params: z.object({ classId: z.string().trim().min(1).max(200) }),
  query: z.object({}).optional(),
});
