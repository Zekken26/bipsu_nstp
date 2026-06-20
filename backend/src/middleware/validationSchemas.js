import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
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
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Email or student ID is required'),
    password: z.string().min(1, 'Password is required'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const nstpCollectionSchema = z.object({
  body: z.record(z.unknown()),
  params: z.object({
    collection: z.string().min(1),
  }).optional(),
  query: z.object({}).optional(),
});

export const nstpBatchSchema = z.object({
  body: z.array(z.record(z.unknown())).min(1, 'Expected a non-empty array'),
  params: z.object({
    collection: z.string().min(1),
  }).optional(),
  query: z.object({}).optional(),
});
