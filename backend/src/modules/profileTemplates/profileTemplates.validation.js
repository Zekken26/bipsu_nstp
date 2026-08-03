import { z } from 'zod';

const profileField = z.enum([
  'surname', 'firstName', 'middleName', 'school', 'degreeProgram', 'yearLevel', 'major',
  'gender', 'birthdate', 'houseStreetPurok', 'barangay', 'currentAddress',
  'provincialAddress', 'municipality', 'province', 'contactNumber', 'email', 'studentId',
]);

const headerImage = z.string().max(750_000, 'Header image is too large').refine(
  (value) => /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(value),
  'Header image must be a PNG or JPEG data URL',
);

export const profileTemplateConfigurationSchema = z.object({
  layout: z.enum(['classic', 'compact', 'formal']),
  pageSize: z.enum(['a4', 'letter']),
  orientation: z.enum(['portrait', 'landscape']),
  republicLine: z.string().trim().min(1).max(200),
  schoolName: z.string().trim().min(1).max(200),
  certificationLine: z.string().trim().max(200),
  officeName: z.string().trim().min(1).max(200),
  formTitle: z.string().trim().min(1).max(150),
  academicPeriod: z.string().trim().min(1).max(150),
  fieldHeader: z.string().trim().min(1).max(100),
  valueHeader: z.string().trim().min(1).max(100),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Accent color must be a six-digit hex color'),
  leftCopyLabel: z.string().trim().max(100),
  rightCopyLabel: z.string().trim().max(100),
  studentSignatureLabel: z.string().trim().max(150),
  signatoryName: z.string().trim().min(1).max(150),
  signatoryTitle: z.string().trim().min(1).max(150),
  headerImageDataUrl: headerImage.optional(),
  headerImageName: z.string().trim().max(255).optional(),
  signatureSpacing: z.number().int().min(20).max(160),
  fieldOrder: z.array(profileField).min(1).max(18).refine((items) => new Set(items).size === items.length, 'Template fields must be unique'),
  showFieldBorders: z.boolean(),
  repeatHeader: z.boolean(),
}).strict();

export const createProfileTemplateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    configuration: profileTemplateConfigurationSchema,
  }).strict(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const profileTemplateIdSchema = z.object({
  body: z.object({}).strict().optional(),
  params: z.object({ id: z.string().min(1).max(200) }),
  query: z.object({}).optional(),
});

export const profileExportEventSchema = z.object({
  body: z.object({
    studentId: z.string().trim().min(1).max(200),
    format: z.enum(['PRINT', 'PDF', 'DOCX']),
  }).strict(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
