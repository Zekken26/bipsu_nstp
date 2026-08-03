import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    studentId: z.string().min(1, 'Student ID is required'),
    firstName: z.string().optional(),
    middleName: z.string().optional(),
    surname: z.string().optional(),
    school: z.string().optional(),
    department: z.string().optional(),
    degreeProgram: z.string().optional(),
    yearLevel: z.string().optional(),
    major: z.string().optional(),
    gender: z.string().optional(),
    birthdate: z.string().optional(),
    houseStreetPurok: z.string().optional(),
    barangay: z.string().optional(),
    municipality: z.string().optional(),
    province: z.string().optional(),
    contactNumber: z.string().optional(),
    currentAddress: z.string().optional(),
    provincialAddress: z.string().optional(),
    assignedMunicipality: z.string().optional(),
  }).strict(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Email or student ID is required'),
    password: z.string().min(1, 'Password is required'),
  }).strict(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    data: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      contactNumber: z.string().optional(),
    }).strict().optional(),
  }).strict(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const nstpBatchSchema = z.object({
  body: z.array(z.record(z.unknown())).min(1, 'Expected a non-empty array'),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const moduleFields = {
  title: z.string().trim().min(1, 'Module title is required').max(200),
  description: z.string().trim().min(1, 'Module description is required').max(10000),
  component: z.enum(['Common', 'CWTS', 'LTS', 'MTS (Army)', 'MTS (Navy)', 'CWTS (Coast Guard)']),
  hours: z.number().int().min(1).max(100),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  order: z.number().int().min(0).max(10000),
  courseCode: z.string().trim().max(50).optional(),
  semester: z.string().trim().max(50).optional(),
  schoolYear: z.string().trim().max(20).optional(),
  sourceDocument: z.string().trim().max(2048).optional(),
  outcomes: z.array(z.string().trim().min(1).max(500)).max(50).optional(),
  videoUrl: z.string().trim().max(2048).optional(),
  meetingLink: z.string().trim().max(2048).optional(),
  documentLink: z.string().trim().max(2048).optional(),
  speaker: z.string().trim().max(200).optional(),
  speakerPosition: z.string().trim().max(200).optional(),
  scheduledDate: z.string().trim().max(40).optional(),
  scheduledTime: z.string().trim().max(100).optional(),
};

export const createModuleSchema = z.object({
  body: z.object({
    ...moduleFields,
    component: moduleFields.component.default('Common'),
    difficulty: moduleFields.difficulty.default('Beginner'),
    status: z.literal('DRAFT').optional(),
    order: moduleFields.order.default(0),
  }).strict(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateModuleSchema = z.object({
  body: z.object(moduleFields).partial().strict().refine((value) => Object.keys(value).length > 0, 'At least one module field is required'),
  params: z.object({ id: z.string().min(1).max(200) }),
  query: z.object({}).optional(),
});

export const createFollowSchema = z.object({
  body: z.object({
    targetUserId: z.string().min(1, 'Target user is required'),
  }).strict(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const createPaymentSchema = z.object({
  body: z.object({
    amount: z.number().finite().positive().max(100000, 'Amount exceeds the allowed limit'),
    currency: z.literal('PHP'),
    purpose: z.literal('ENROLLMENT_FEE'),
    targetEnrollmentId: z.string().min(1, 'Target enrollment is required'),
  }).strict(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
