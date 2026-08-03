import bcrypt from 'bcrypt';
import prisma from '../../db/prisma.js';
import { adminAccountSelect, adminStudentSelect, pendingRegistrationSelect, toAdminAccountDto, toAdminStudentDto } from '../auth/user.dto.js';
import { assertPlaintextPassword } from '../auth/passwords.js';
import { normalizeModuleUrls } from './module-url.validation.js';

const now = () => new Date().toISOString();

export async function getDatabaseStatus() {
  const result = await prisma.$queryRaw`SELECT current_database() AS database, current_user AS user, NOW() AS time`;
  return {
    ok: true,
    provider: 'postgresql',
    connection: result[0],
  };
}

class DatabaseUnavailableError extends Error {
  constructor(resource, cause) {
    super(`The ${resource} data service is temporarily unavailable.`);
    this.name = 'DatabaseUnavailableError';
    this.statusCode = 503;
    this.code = 'DATABASE_UNAVAILABLE';
    this.cause = cause;
  }
}

function classifyDatabaseError(error, resource) {
  if (error?.statusCode) return error;
  // Prisma's connection/pool failures are the only errors that should become 503.
  if (['P1000', 'P1001', 'P1002', 'P1008', 'P1017', 'P2024'].includes(error?.code)) return new DatabaseUnavailableError(resource, error);
  if (/\b(connection|database)\b.*\b(lost|unavailable|refused|timeout)\b/i.test(error?.message || '')) return new DatabaseUnavailableError(resource, error);
  if (error?.code === 'P2002') {
    const conflict = new Error('A record with one of these unique values already exists.');
    conflict.statusCode = 409;
    return conflict;
  }
  if (error?.name === 'PrismaClientValidationError') {
    const invalid = new Error('Invalid account data. Please review the required fields.');
    invalid.statusCode = 400;
    return invalid;
  }
  return error;
}

const toUserRole = (role) => {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'admin') return 'ADMIN';
  if (normalized === 'coordinator') return 'COORDINATOR';
  if (normalized === 'instructor' || normalized === 'facilitator' || normalized === 'speaker') return 'INSTRUCTOR';
  return 'STUDENT';
};

const toComponentType = (component) => {
  const normalized = String(component || '').toUpperCase().replace(/\s+/g, '_').replace(/[()]/g, '');
  if (normalized.includes('ARMY')) return 'MTS_ARMY';
  if (normalized.includes('NAVY')) return 'MTS_NAVY';
  if (normalized === 'LTS') return 'LTS';
  if (normalized.includes('CWTS') && normalized.includes('COAST')) return 'CWTS_COAST_GUARD';
  return 'CWTS';
};

const withDatabase = async (name, operation) => {
  try {
    return await operation();
  } catch (error) {
    // Never substitute empty or in-memory data for official academic records.
    // The error handler deliberately returns a safe, structured 503 response.
    console.warn(`Prisma ${name} operation failed: ${error?.message || error}`);
    throw classifyDatabaseError(error, name);
  }
};

const toModuleDto = (mod) => ({
  ...mod,
  ...(mod.data || {}),
  data: undefined,
  component: mod.component?.name || mod.data?.component || 'Common',
  status: mod.status || (mod.isPublished ? 'PUBLISHED' : 'DRAFT'),
  completedStudents: mod._count?.progress || 0,
});

const moduleExtraFields = [
  'component', 'courseCode', 'semester', 'schoolYear', 'sourceDocument', 'outcomes',
  'difficulty', 'videoUrl', 'meetingLink', 'documentLink', 'speaker',
  'speakerPosition', 'scheduledDate', 'scheduledTime',
];

function moduleData(payload) {
  return Object.fromEntries(moduleExtraFields
    .filter((field) => payload[field] !== undefined)
    .map((field) => [field, payload[field]]));
}

async function resolveModuleComponent(client, component, forcedComponentId = null) {
  if (forcedComponentId) return forcedComponentId;
  if (!component || component === 'Common') return null;
  const record = await client.nSTPComponent.findUnique({ where: { type: toComponentType(component) }, select: { id: true } });
  if (!record) {
    const error = new Error('The selected NSTP component is not configured.');
    error.statusCode = 400;
    throw error;
  }
  return record.id;
}

function assertModulePublishable(payload) {
  if (payload.status !== 'PUBLISHED') return;
  if (!String(payload.title || '').trim() || !String(payload.description || '').trim() || !Number(payload.hours)) {
    const error = new Error('A title, description, and valid duration are required before publishing.');
    error.statusCode = 400;
    throw error;
  }
}

function moduleWriteData(payload, componentId) {
  const status = payload.status || 'DRAFT';
  return {
    title: payload.title,
    description: payload.description || '',
    hours: Number(payload.hours),
    order: Number(payload.order) || 0,
    status,
    isPublished: status === 'PUBLISHED',
    componentId,
    data: moduleData(payload),
  };
}

export async function listManagedModules(componentId = null, instructorId = null, instructorComponentIds = []) {
  return withDatabase('modules', async () => {
    const instructorScope = instructorId ? {
      OR: [
        { instructorId },
        ...(instructorComponentIds.length ? [{ componentId: { in: [...new Set(instructorComponentIds)] } }] : []),
      ],
    } : {};
    const modules = await prisma.module.findMany({
      ...((componentId || instructorId) ? { where: { ...(componentId ? { componentId } : {}), ...instructorScope } } : {}),
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        component: { select: { id: true, name: true, type: true } },
        _count: { select: { progress: { where: { completedAt: { not: null } } } } },
      },
    });
    return modules.map(toModuleDto);
  });
}

export async function listPublishedModules(componentIds = []) {
  const allowedComponentIds = [...new Set(componentIds.filter(Boolean))];
  return withDatabase('modules', async () => {
    const modules = await prisma.module.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [{ componentId: null }, ...(allowedComponentIds.length ? [{ componentId: { in: allowedComponentIds } }] : [])],
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        component: { select: { id: true, name: true, type: true } },
        _count: { select: { progress: { where: { completedAt: { not: null } } } } },
      },
    });
    return modules.map(toModuleDto);
  });
}

export async function createManagedModule(actorId, payload, forcedComponentId = null) {
  const normalized = normalizeModuleUrls(payload);
  return withDatabase('modules', () => prisma.$transaction(async (tx) => {
    const componentId = await resolveModuleComponent(tx, normalized.component, forcedComponentId);
    const created = await tx.module.create({
      data: moduleWriteData({ ...normalized, status: 'DRAFT' }, componentId),
      include: { component: { select: { id: true, name: true, type: true } } },
    });
    await tx.auditLogEntry.create({
      data: { id: crypto.randomUUID(), actor: actorId, action: 'MODULE_CREATED', detail: JSON.stringify({ moduleId: created.id, status: created.status }) },
    });
    return toModuleDto(created);
  }));
}

export async function updateManagedModule(actorId, id, patch, forcedComponentId = null) {
  const normalized = normalizeModuleUrls(patch);
  return withDatabase('modules', () => prisma.$transaction(async (tx) => {
    const existing = await tx.module.findUnique({ where: { id }, include: { component: true } });
    if (!existing) {
      const error = new Error('Module not found.');
      error.statusCode = 404;
      throw error;
    }
    if (forcedComponentId && existing.componentId !== forcedComponentId) {
      const error = new Error('You cannot modify a module outside your assigned component.');
      error.statusCode = 403;
      throw error;
    }
    const existingDto = toModuleDto(existing);
    const merged = { ...existingDto, ...normalized };
    assertModulePublishable(merged);
    const componentId = await resolveModuleComponent(tx, merged.component, forcedComponentId);
    const updated = await tx.module.update({
      where: { id },
      data: moduleWriteData(merged, componentId),
      include: { component: { select: { id: true, name: true, type: true } } },
    });
    await tx.auditLogEntry.create({
      data: { id: crypto.randomUUID(), actor: actorId, action: 'MODULE_UPDATED', detail: JSON.stringify({ moduleId: id, previousStatus: existing.status, status: updated.status }) },
    });
    return toModuleDto(updated);
  }));
}

export async function removeManagedModule(actorId, id, forcedComponentId = null) {
  return withDatabase('modules', () => prisma.$transaction(async (tx) => {
    const existing = await tx.module.findUnique({
      where: { id },
      include: { _count: { select: { lessons: true, quizzes: true, assignments: true, exams: true, grades: true, progress: true } } },
    });
    if (!existing) {
      const error = new Error('Module not found.');
      error.statusCode = 404;
      throw error;
    }
    if (forcedComponentId && existing.componentId !== forcedComponentId) {
      const error = new Error('You cannot delete a module outside your assigned component.');
      error.statusCode = 403;
      throw error;
    }
    const hasReferences = Object.values(existing._count).some((count) => count > 0);
    if (hasReferences) {
      await tx.module.update({ where: { id }, data: { status: 'ARCHIVED', isPublished: false } });
    } else {
      await tx.module.delete({ where: { id } });
    }
    await tx.auditLogEntry.create({
      data: { id: crypto.randomUUID(), actor: actorId, action: hasReferences ? 'MODULE_ARCHIVED' : 'MODULE_DELETED', detail: JSON.stringify({ moduleId: id }) },
    });
    return { id, archived: hasReferences };
  }));
}

const assessmentInclude = {
  module: { include: { component: { select: { id: true, name: true, type: true } } } },
  questions: { orderBy: { order: 'asc' } },
  _count: { select: { submissions: true, grades: true } },
};

function storedAssessmentQuestions(quiz) {
  if (quiz.questions?.length) {
    return quiz.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: Array.isArray(question.options) ? question.options : [],
      correctIndex: Number(question.answer?.correctIndex ?? 0),
    }));
  }
  return Array.isArray(quiz.data?.questions) ? quiz.data.questions : [];
}

function toManagedAssessmentDto(quiz) {
  const definition = quiz.data || {};
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.instructions || '',
    moduleId: quiz.moduleId,
    moduleTitle: quiz.module?.title || 'Unavailable module',
    moduleStatus: quiz.module?.status || 'ARCHIVED',
    component: quiz.module?.component?.name || quiz.module?.data?.component || 'Common',
    type: definition.type || 'quiz',
    timeLimit: Number(definition.timeLimit || 15),
    passingScore: Number(definition.passingScore ?? 70),
    questionsToShow: Number(definition.questionsToShow || 0),
    ownerId: definition.ownerId || '',
    ownerName: definition.ownerName || 'Administrator',
    ownerRole: definition.ownerRole || 'admin',
    status: String(quiz.status || 'DRAFT').toLowerCase(),
    questions: storedAssessmentQuestions(quiz),
    attemptCount: quiz._count?.submissions || 0,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
  };
}

function toStudentAssessmentDto(quiz) {
  const managed = toManagedAssessmentDto(quiz);
  return {
    ...managed,
    ownerId: undefined,
    ownerName: undefined,
    ownerRole: undefined,
    attemptCount: undefined,
    questions: managed.questions.map(({ correctIndex: _correctIndex, ...question }) => question),
  };
}

function assessmentModuleWhere(actor) {
  if (actor.role === 'ADMIN') return {};
  if (actor.role === 'COORDINATOR') return { componentId: actor.componentId };
  if (actor.role === 'INSTRUCTOR') return {
    OR: [
      { instructorId: actor.instructorId },
      ...(actor.componentIds?.length ? [{ componentId: { in: actor.componentIds } }] : []),
    ],
  };
  return { id: '__forbidden__' };
}

async function requireManageableModule(client, actor, moduleId, publishing = false) {
  const module = await client.module.findFirst({
    where: { id: moduleId, ...assessmentModuleWhere(actor) },
    include: { component: true },
  });
  if (!module) {
    const error = new Error('The selected module does not exist or is not assigned to you.');
    error.statusCode = 403;
    throw error;
  }
  if (module.status === 'ARCHIVED') {
    const error = new Error('Archived modules cannot receive assessments.');
    error.statusCode = 409;
    throw error;
  }
  if (publishing && module.status !== 'PUBLISHED') {
    const error = new Error('Publish the connected module before publishing its assessment.');
    error.statusCode = 409;
    throw error;
  }
  return module;
}

function assertAssessmentPublishable(payload) {
  if (payload.status !== 'PUBLISHED') return;
  if (!payload.questions?.length) {
    const error = new Error('At least one valid question is required before publishing.');
    error.statusCode = 400;
    throw error;
  }
  if (payload.questionsToShow > payload.questions.length) {
    const error = new Error('Questions to show cannot exceed the number of assessment questions.');
    error.statusCode = 400;
    throw error;
  }
}

async function resolveAssessmentOwner(client, actor, requestedOwnerId) {
  if (actor.role !== 'ADMIN' || !requestedOwnerId || requestedOwnerId === actor.userId) {
    return { ownerId: actor.userId, ownerName: actor.name, ownerRole: actor.role.toLowerCase() };
  }
  const owner = await client.user.findFirst({
    where: { id: requestedOwnerId, role: 'INSTRUCTOR' },
    select: { id: true, name: true },
  });
  if (!owner) {
    const error = new Error('The selected facilitator account is invalid.');
    error.statusCode = 400;
    throw error;
  }
  return { ownerId: owner.id, ownerName: owner.name, ownerRole: 'facilitator' };
}

function assessmentData(payload, owner) {
  return {
    type: payload.type,
    timeLimit: Number(payload.timeLimit),
    passingScore: Number(payload.passingScore),
    questionsToShow: Number(payload.questionsToShow || 0),
    ...owner,
  };
}

async function replaceAssessmentQuestions(client, quizId, questions) {
  await client.question.deleteMany({ where: { quizId } });
  if (!questions.length) return;
  await client.question.createMany({
    data: questions.map((question, order) => ({
      id: crypto.randomUUID(),
      quizId,
      prompt: question.prompt,
      options: question.options,
      answer: { correctIndex: question.correctIndex },
      points: 1,
      order,
    })),
  });
}

export async function listManagedAssessments(actor) {
  return withDatabase('assessments', async () => {
    const records = await prisma.quiz.findMany({
      where: { module: assessmentModuleWhere(actor) },
      orderBy: { createdAt: 'desc' },
      include: assessmentInclude,
    });
    return records.map(toManagedAssessmentDto);
  });
}

export async function listStudentAssessments(componentId) {
  return withDatabase('assessments', async () => {
    const records = await prisma.quiz.findMany({
      where: {
        status: 'PUBLISHED',
        module: {
          status: 'PUBLISHED',
          OR: [{ componentId: null }, ...(componentId ? [{ componentId }] : [])],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: assessmentInclude,
    });
    return records.map(toStudentAssessmentDto);
  });
}

export async function createManagedAssessment(actor, payload) {
  return withDatabase('assessments', () => prisma.$transaction(async (tx) => {
    await requireManageableModule(tx, actor, payload.moduleId, false);
    const owner = await resolveAssessmentOwner(tx, actor, payload.ownerId);
    const created = await tx.quiz.create({
      data: {
        title: payload.title,
        instructions: payload.description || '',
        moduleId: payload.moduleId,
        totalPoints: payload.questions.length,
        status: 'DRAFT',
        data: assessmentData(payload, owner),
      },
    });
    await replaceAssessmentQuestions(tx, created.id, payload.questions);
    await tx.auditLogEntry.create({
      data: { id: crypto.randomUUID(), actor: actor.userId, action: 'ASSESSMENT_CREATED', detail: JSON.stringify({ assessmentId: created.id, moduleId: created.moduleId }) },
    });
    return toManagedAssessmentDto(await tx.quiz.findUnique({ where: { id: created.id }, include: assessmentInclude }));
  }));
}

export async function updateManagedAssessment(actor, id, patch) {
  return withDatabase('assessments', () => prisma.$transaction(async (tx) => {
    const existing = await tx.quiz.findUnique({ where: { id }, include: assessmentInclude });
    if (!existing) {
      const error = new Error('Assessment not found.');
      error.statusCode = 404;
      throw error;
    }
    await requireManageableModule(tx, actor, existing.moduleId, false);
    const current = toManagedAssessmentDto(existing);
    const merged = { ...current, ...patch, status: patch.status || String(existing.status) };
    await requireManageableModule(tx, actor, merged.moduleId, merged.status === 'PUBLISHED');
    assertAssessmentPublishable(merged);
    const owner = await resolveAssessmentOwner(tx, actor, patch.ownerId || current.ownerId);
    await tx.quiz.update({
      where: { id },
      data: {
        title: merged.title,
        instructions: merged.description || '',
        moduleId: merged.moduleId,
        totalPoints: merged.questions.length,
        status: merged.status,
        data: assessmentData(merged, owner),
      },
    });
    if (patch.questions) await replaceAssessmentQuestions(tx, id, merged.questions);
    await tx.auditLogEntry.create({
      data: { id: crypto.randomUUID(), actor: actor.userId, action: 'ASSESSMENT_UPDATED', detail: JSON.stringify({ assessmentId: id, previousStatus: existing.status, status: merged.status }) },
    });
    return toManagedAssessmentDto(await tx.quiz.findUnique({ where: { id }, include: assessmentInclude }));
  }));
}

export async function removeManagedAssessment(actor, id) {
  return withDatabase('assessments', () => prisma.$transaction(async (tx) => {
    const existing = await tx.quiz.findUnique({ where: { id }, include: assessmentInclude });
    if (!existing) {
      const error = new Error('Assessment not found.');
      error.statusCode = 404;
      throw error;
    }
    await requireManageableModule(tx, actor, existing.moduleId, false);
    const hasResults = (existing._count?.submissions || 0) > 0 || (existing._count?.grades || 0) > 0;
    if (hasResults) await tx.quiz.update({ where: { id }, data: { status: 'ARCHIVED' } });
    else await tx.quiz.delete({ where: { id } });
    await tx.auditLogEntry.create({
      data: { id: crypto.randomUUID(), actor: actor.userId, action: hasResults ? 'ASSESSMENT_ARCHIVED' : 'ASSESSMENT_DELETED', detail: JSON.stringify({ assessmentId: id }) },
    });
    return { id, archived: hasResults };
  }));
}

export async function listAssessmentAttempts() {
  return withDatabase('assessment attempts', async () => {
    const attempts = await prisma.submission.findMany({
      where: { quizId: { not: null } },
      orderBy: { submittedAt: 'desc' },
      take: 500,
      include: {
        student: { include: { user: { select: { id: true, name: true, email: true } } } },
        quiz: { select: { id: true, title: true, data: true } },
      },
    });
    return attempts.map((attempt) => ({
      id: attempt.id,
      studentId: attempt.student.user.id,
      studentName: attempt.student.user.name,
      studentEmail: attempt.student.user.email,
      assessmentId: attempt.quiz.id,
      assessmentTitle: attempt.quiz.title,
      score: attempt.score,
      passed: Number(attempt.score || 0) >= Number(attempt.quiz.data?.passingScore ?? 70),
      manualStatus: attempt.content?.override?.status,
      submittedAt: attempt.submittedAt,
    }));
  });
}

export async function overrideAssessmentAttempt(actor, id, status, reason) {
  return withDatabase('assessment attempts', () => prisma.$transaction(async (tx) => {
    const existing = await tx.submission.findUnique({ where: { id }, include: { quiz: true } });
    if (!existing?.quizId) {
      const error = new Error('Assessment attempt not found.');
      error.statusCode = 404;
      throw error;
    }
    const previous = existing.content?.override?.status || (Number(existing.score || 0) >= Number(existing.quiz.data?.passingScore ?? 70) ? 'passed' : 'failed');
    const changedAt = new Date().toISOString();
    const updated = await tx.submission.update({
      where: { id },
      data: { content: { ...(existing.content || {}), override: { previous, status, reason, actorId: actor.userId, changedAt } } },
    });
    await tx.auditLogEntry.create({
      data: { id: crypto.randomUUID(), actor: actor.userId, action: 'ASSESSMENT_ATTEMPT_OVERRIDDEN', detail: JSON.stringify({ attemptId: id, previous, status, reason }) },
    });
    return { id: updated.id, previous, status, reason, changedAt };
  }));
}

function normalizeFacilitatorMunicipalities(value) {
  if (!Array.isArray(value)) {
    const error = new Error('Facilitators must be assigned to between 1 and 3 municipalities.');
    error.statusCode = 400;
    throw error;
  }

  const municipalities = [...new Set(value.map((municipality) => String(municipality).trim()).filter(Boolean))];
  if (municipalities.length < 1 || municipalities.length > 3) {
    const error = new Error('Facilitators must be assigned to between 1 and 3 municipalities.');
    error.statusCode = 400;
    throw error;
  }
  return municipalities;
}

// These functions deliberately receive a resource name only from server-side
// route handlers. Never pass a client-controlled collection name here.
export async function listAdminResource(name, filters = {}) {
  if (name === 'accounts') {
    const role = filters.role ? String(filters.role).toUpperCase() : null;
    if (role && !['ADMIN', 'COORDINATOR', 'INSTRUCTOR', 'STUDENT'].includes(role)) {
      const error = new Error('Invalid account role filter.');
      error.statusCode = 400;
      throw error;
    }
    const accounts = await withDatabase(name, () => prisma.user.findMany({
      ...(role ? { where: { role } } : {}),
      orderBy: { createdAt: 'desc' },
      select: adminAccountSelect,
    }));
    return accounts.map(toAdminAccountDto);
  }

  if (name === 'modules') {
    return listManagedModules();
  }

  if (name === 'students') {
    const students = await withDatabase(name, () => prisma.studentProfile.findMany({
      orderBy: { createdAt: 'desc' },
      select: adminStudentSelect,
    }));
    return students.map(toAdminStudentDto);
  }

  if (name === 'grades') {
    return withDatabase(name, async () => prisma.grade.findMany({ orderBy: { createdAt: 'desc' } }));
  }

  if (name === 'assessments') {
    return withDatabase(name, async () => {
      const quizzes = await prisma.quiz.findMany({
        orderBy: { createdAt: 'desc' },
        include: { module: true, questions: true },
      });
      return quizzes.map((quiz) => ({
        ...quiz,
        ...(quiz.data || {}),
        data: undefined,
      }));
    });
  }

  const simpleList = (model) => withDatabase(name, () => model.findMany({ orderBy: { createdAt: 'desc' } }));

  if (name === 'pending-registrations') {
    return withDatabase(name, () => prisma.pendingRegistration.findMany({
      where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' }, select: pendingRegistrationSelect,
    }));
  }
  if (name === 'training-groups') return simpleList(prisma.trainingGroup);
  if (name === 'attendance-records') return simpleList(prisma.attendanceRecord);
  if (name === 'attendance-sessions') return simpleList(prisma.attendanceSession);
  if (name === 'qualifying-results') return simpleList(prisma.qualifyingExamResult);
  if (name === 'component-state') return withDatabase(name, () => prisma.componentApplicationState.findMany());
  if (name === 'audit-log') return simpleList(prisma.auditLogEntry);

  return [];
}

export async function upsertAdminResource(name, lookup, payload) {
  if (Object.hasOwn(payload || {}, 'passwordHash')) {
    const error = new Error('passwordHash is not accepted. Supply a plaintext password through the approved provisioning flow.');
    error.statusCode = 400;
    throw error;
  }
  const nextPayload = { ...payload, updatedAt: payload.updatedAt || now() };

  try {
    if (name === 'accounts') {
      const profileData = nextPayload.data || {};
      const explicitFields = ['surname', 'firstName', 'middleName', 'school', 'department', 'degreeProgram', 'yearLevel', 'major', 'gender', 'birthdate', 'houseStreetPurok', 'barangay', 'municipality', 'municipalities', 'province', 'provincialAddress', 'contactNumber', 'currentAddress', 'cityAddress', 'title', 'bio', 'generalEducationComplete', 'preferredComponent', 'examTaken', 'examScore', 'component', 'componentAccessStatus'];
      for (const field of explicitFields) {
        if (nextPayload[field] !== undefined) profileData[field] = nextPayload[field];
      }
      const existingUser = nextPayload.email
        ? await prisma.user.findUnique({ where: { email: nextPayload.email }, select: { id: true } })
        : null;
      if (!existingUser && nextPayload.password === undefined) {
        const error = new Error('A password of at least 8 characters is required when creating an account.');
        error.statusCode = 400;
        throw error;
      }
      if (nextPayload.password !== undefined) assertPlaintextPassword(nextPayload.password);
      const passwordHash = nextPayload.password ? await bcrypt.hash(nextPayload.password, 10) : undefined;
      const userRole = toUserRole(nextPayload.role);
      if (userRole === 'COORDINATOR') delete profileData.municipalities;
      if (userRole === 'INSTRUCTOR') profileData.municipalities = normalizeFacilitatorMunicipalities(profileData.municipalities);
      const user = await prisma.user.upsert({
        where: { email: nextPayload.email },
        update: {
          name: nextPayload.name,
          role: userRole,
          data: profileData,
          ...(passwordHash ? { passwordHash } : {}),
        },
        create: {
          id: nextPayload.id,
          name: nextPayload.name || nextPayload.email,
          email: nextPayload.email,
          passwordHash,
          role: userRole,
          data: profileData,
        },
        select: { id: true },
      });

      if (userRole === 'INSTRUCTOR') {
        await prisma.instructorProfile.upsert({
          where: { userId: user.id },
          update: {
            employeeNumber: profileData.employeeNumber || `fac-${user.id.slice(0, 8)}`,
            department: profileData.department || null,
            title: profileData.title || null,
          },
          create: {
            userId: user.id,
            employeeNumber: profileData.employeeNumber || `fac-${user.id.slice(0, 8)}`,
            department: profileData.department || null,
            title: profileData.title || null,
          },
        });
      }

      if (userRole === 'COORDINATOR') {
        let component = profileData.componentId
          ? await prisma.nSTPComponent.findUnique({ where: { id: profileData.componentId } })
          : null;
        if (!component && profileData.component) {
          component = await prisma.nSTPComponent.findUnique({ where: { type: toComponentType(profileData.component) } });
        }
        await prisma.coordinatorProfile.upsert({
          where: { userId: user.id },
          update: {
            employeeNumber: profileData.employeeNumber || `coord-${user.id.slice(0, 8)}`,
            componentId: component?.id || null,
          },
          create: {
            userId: user.id,
            employeeNumber: profileData.employeeNumber || `coord-${user.id.slice(0, 8)}`,
            componentId: component?.id || null,
          },
        });
      }

      return toAdminAccountDto(await prisma.user.findUnique({ where: { id: user.id }, select: adminAccountSelect }));
    }

    if (name === 'modules') {
      const normalizedModulePayload = normalizeModuleUrls(nextPayload);
      const moduleKnownFields = ['id', 'title', 'description', 'hours', 'published', 'isPublished', 'status', 'order', 'componentId', 'updatedAt', 'createdAt', 'data'];
      const moduleExtras = {};
      for (const key of Object.keys(normalizedModulePayload)) {
        if (!moduleKnownFields.includes(key)) moduleExtras[key] = normalizedModulePayload[key];
      }
      const updatedModuleData = { ...(normalizedModulePayload.data || {}), ...moduleExtras };
      const moduleStatus = normalizedModulePayload.status || (normalizedModulePayload.published ?? normalizedModulePayload.isPublished ? 'PUBLISHED' : 'DRAFT');
      return await prisma.module.upsert({
        where: { id: normalizedModulePayload.id },
        update: {
          title: normalizedModulePayload.title,
          description: normalizedModulePayload.description,
          hours: Number(normalizedModulePayload.hours) || null,
          status: moduleStatus,
          isPublished: moduleStatus === 'PUBLISHED',
          data: updatedModuleData,
        },
        create: {
          id: normalizedModulePayload.id,
          title: normalizedModulePayload.title || 'Untitled module',
          description: normalizedModulePayload.description,
          hours: Number(normalizedModulePayload.hours) || null,
          status: moduleStatus,
          isPublished: moduleStatus === 'PUBLISHED',
          data: updatedModuleData,
        },
      });
    }

    if (name === 'assessments') {
      if (!nextPayload.moduleId) {
        const error = new Error('A valid module is required for every assessment.');
        error.statusCode = 400;
        throw error;
      }
      const knownFields = ['id', 'title', 'description', 'moduleId', 'questions', 'updatedAt', 'createdAt'];
      const extras = {};
      for (const key of Object.keys(nextPayload)) {
        if (!knownFields.includes(key)) extras[key] = nextPayload[key];
      }
      const updatedQuizData = { ...(nextPayload.data || {}), ...extras };
      return await prisma.quiz.upsert({
        where: { id: nextPayload.id || 'none' },
        update: {
          title: nextPayload.title,
          ...(nextPayload.description !== undefined ? { instructions: nextPayload.description } : {}),
          ...(nextPayload.status ? { status: String(nextPayload.status).toUpperCase() } : {}),
          data: updatedQuizData,
        },
        create: {
          id: nextPayload.id,
          title: nextPayload.title || 'Untitled assessment',
          moduleId: nextPayload.moduleId,
          status: String(nextPayload.status || 'DRAFT').toUpperCase(),
          ...(nextPayload.description !== undefined ? { instructions: nextPayload.description } : {}),
          data: updatedQuizData,
        },
      });
    }

    if (name === 'students') {
      const existingUser = nextPayload.email
        ? await prisma.user.findUnique({ where: { email: nextPayload.email }, select: { id: true } })
        : null;
      if (!existingUser && nextPayload.password === undefined) {
        const error = new Error('A password of at least 8 characters is required when creating a student account.');
        error.statusCode = 400;
        throw error;
      }
      if (nextPayload.password !== undefined) assertPlaintextPassword(nextPayload.password);
      const studentPasswordHash = nextPayload.password ? await bcrypt.hash(nextPayload.password, 10) : undefined;
      const user = await prisma.user.upsert({
        where: { email: nextPayload.email },
        update: { name: nextPayload.name, role: 'STUDENT' },
        create: {
          name: nextPayload.name || nextPayload.email,
          email: nextPayload.email,
          passwordHash: studentPasswordHash,
          role: 'STUDENT',
        },
        select: { id: true },
      });

      const component = await prisma.nSTPComponent.upsert({
        where: { type: toComponentType(nextPayload.component) },
        update: {},
        create: {
          type: toComponentType(nextPayload.component),
          name: nextPayload.component || 'CWTS',
        },
      });

      const studentKnownFields = ['id', 'studentId', 'studentNumber', 'userId', 'componentId', 'component', 'course', 'yearLevel', 'sectionId', 'email', 'password', 'name', 'updatedAt', 'createdAt'];
      const studentExtras = {};
      for (const key of Object.keys(nextPayload)) {
        if (!studentKnownFields.includes(key)) studentExtras[key] = nextPayload[key];
      }
      const updatedStudentData = { ...(nextPayload.data || {}), ...studentExtras };

      return await prisma.studentProfile.upsert({
        where: { studentNumber: nextPayload.studentId || nextPayload.studentNumber },
        update: {
          userId: user.id,
          componentId: component.id,
          course: nextPayload.course,
          yearLevel: nextPayload.yearLevel,
          data: updatedStudentData,
        },
        create: {
          id: nextPayload.id,
          userId: user.id,
          studentNumber: nextPayload.studentId || nextPayload.studentNumber,
          componentId: component.id,
          course: nextPayload.course,
          yearLevel: nextPayload.yearLevel,
          data: updatedStudentData,
        },
      });
    }

    const upsertSimple = (model, where) => model.upsert({
      where: where || { id: nextPayload.id || 'none' },
      update: { ...nextPayload, updatedAt: undefined },
      create: { ...nextPayload, updatedAt: undefined },
    });

    if (name === 'pending-registrations') {
      const regPayload = { ...nextPayload };
      if (regPayload.password) {
        assertPlaintextPassword(regPayload.password);
        regPayload.password = await bcrypt.hash(regPayload.password, 10);
      }
      const { updatedAt, ...regClean } = regPayload;
      return await prisma.pendingRegistration.upsert({
        where: { id: regClean.id || 'none' },
        update: regClean,
        create: regClean,
      });
    }
    if (name === 'grades') {
      if (!nextPayload.id || !nextPayload.studentId) {
        const error = new Error('Grade id and studentId are required.');
        error.statusCode = 400;
        throw error;
      }
      const { id, updatedAt, ...gradeData } = nextPayload;
      return prisma.grade.upsert({
        where: { id },
        update: gradeData,
        create: { id, ...gradeData },
      });
    }
    if (name === 'training-groups') return await upsertSimple(prisma.trainingGroup);
    if (name === 'attendance-records') return await upsertSimple(prisma.attendanceRecord);
    if (name === 'attendance-sessions') return await upsertSimple(prisma.attendanceSession);
    if (name === 'qualifying-results') return await upsertSimple(prisma.qualifyingExamResult);
    if (name === 'component-state') return await upsertSimple(prisma.componentApplicationState);
    if (name === 'audit-log') return await upsertSimple(prisma.auditLogEntry);
  } catch (error) {
    console.warn(`Prisma ${name} upsert failed: ${error?.message || error}`);
    throw classifyDatabaseError(error, name);
  }
}

export async function deleteAdminResource(name, id) {
  try {
    const modelMap = {
      accounts: prisma.user,
      modules: prisma.module,
      assessments: prisma.quiz,
      students: prisma.studentProfile,
      grades: prisma.grade,
      'pending-registrations': prisma.pendingRegistration,
      'training-groups': prisma.trainingGroup,
      'attendance-records': prisma.attendanceRecord,
      'attendance-sessions': prisma.attendanceSession,
      'qualifying-results': prisma.qualifyingExamResult,
      'component-state': prisma.componentApplicationState,
      'audit-log': prisma.auditLogEntry,
    };
    const model = modelMap[name];
    if (model) {
      return await model.delete({ where: { id } });
    }
    if (name === 'notices' || name === 'supportTickets') {
      const items = fallback[name] || [];
      const index = items.findIndex((item) => item.id === id);
      if (index >= 0) items.splice(index, 1);
      return { id, deleted: index >= 0 };
    }
    return null;
  } catch (error) {
    console.warn(`Prisma ${name} delete failed: ${error?.message || error}`);
    throw classifyDatabaseError(error, name);
  }
}

export async function batchUpsertAdminResources(name, records) {
  const results = [];
  for (const payload of records) {
    const lookup = payload.id
      ? { id: payload.id }
      : payload.studentId
        ? { studentId: payload.studentId }
        : payload.email
          ? { email: payload.email }
          : { id: `${name}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}` };
    try {
      const result = await upsertAdminResource(name, lookup, { ...lookup, ...payload });
      results.push(result);
    } catch (err) {
      if (err?.statusCode === 503) throw err;
      results.push({ error: err.message || 'Unknown error', email: payload.email, id: payload.id });
    }
  }
  return results;
}

export async function getAdminSummary() {
  const [students, modules, assessments, grades] = await Promise.all([
    listAdminResource('students'),
    listAdminResource('modules'),
    listAdminResource('assessments'),
    listAdminResource('grades'),
  ]);

  return {
    students: students.length,
    learningHours: modules.reduce((sum, module) => sum + (Number(module.hours) || 0), 0),
    assessments: assessments.length,
    releasedGrades: grades.filter((grade) => grade.isReleased || grade.released).length,
    totalGradeRecords: grades.length,
    reportsGenerated: 12,
    updatedAt: now(),
  };
}
