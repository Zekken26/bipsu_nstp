import { z } from 'zod';

const coordinatorScope = z.enum(['CWTS', 'MTS', 'LTS']);
const componentType = z.enum(['CWTS', 'LTS', 'MTS_ARMY', 'MTS_NAVY', 'CWTS_COAST_GUARD']);
const municipality = z.enum(['Almeria', 'Biliran', 'Cabucgayan', 'Caibiran', 'Culaba', 'Kawayan', 'Maripipi', 'Naval']);

const identityFields = {
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().toLowerCase().email().max(254),
  employeeNumber: z.string().trim().min(2).max(50),
  title: z.string().trim().max(120).optional(),
  contactNumber: z.string().trim().max(30).optional(),
};

const request = (body, params = z.object({}).optional(), query = z.object({}).optional()) => z.object({ body, params, query });

export const listStaffSchema = request(
  z.object({}).optional(),
  z.object({}).optional(),
  z.object({
    search: z.string().trim().max(100).optional(),
    scope: coordinatorScope.optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }).strict(),
);

export const createCoordinatorSchema = request(z.object({
  ...identityFields,
  password: z.string().min(8).max(128),
  scope: coordinatorScope,
}).strict());

export const updateCoordinatorSchema = request(
  z.object({ ...identityFields, password: z.string().min(8).max(128).optional(), scope: coordinatorScope }).partial().strict()
    .refine((value) => Object.keys(value).length > 0, 'At least one coordinator field is required'),
  z.object({ id: z.string().min(1).max(200) }),
);

export const staffIdSchema = request(z.object({}).strict().optional(), z.object({ id: z.string().min(1).max(200) }));

export const createFacilitatorSchema = request(z.object({
  ...identityFields,
  password: z.string().min(8).max(128),
  component: componentType,
  municipalities: z.array(municipality).min(1).max(3).refine((values) => new Set(values).size === values.length, 'Municipalities must be unique'),
}).strict());

export const updateFacilitatorSchema = request(
  z.object({
    ...identityFields,
    password: z.string().min(8).max(128).optional(),
    component: componentType,
    municipalities: z.array(municipality).min(1).max(3).refine((values) => new Set(values).size === values.length, 'Municipalities must be unique'),
  }).partial().strict().refine((value) => Object.keys(value).length > 0, 'At least one facilitator field is required'),
  z.object({ id: z.string().min(1).max(200) }),
);
