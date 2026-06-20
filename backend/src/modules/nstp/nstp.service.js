import prisma from '../../db/prisma.js';

const now = () => new Date().toISOString();

export async function getDatabaseStatus() {
  const result = await prisma.$queryRaw`SELECT current_database() AS database, current_user AS user, NOW() AS time`;
  return {
    ok: true,
    provider: 'postgresql',
    connection: result[0],
  };
}

const fallback = {
  accounts: [],
  modules: [],
  assessments: [],
  students: [],
  grades: [],
  notices: [],
  supportTickets: [],
  'pending-registrations': [],
  'training-groups': [],
  'attendance-records': [],
  'attendance-sessions': [],
  'qualifying-results': [],
  'component-state': [],
  'audit-log': [],
};

const toUserRole = (role) => {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'admin') return 'ADMIN';
  if (normalized === 'instructor' || normalized === 'facilitator' || normalized === 'speaker') return 'INSTRUCTOR';
  return 'STUDENT';
};

const toComponentType = (component) => {
  const normalized = String(component || '').toUpperCase().replace(/\s+/g, '_').replace(/[()]/g, '');
  if (normalized.includes('ARMY')) return 'MTS_ARMY';
  if (normalized.includes('NAVY')) return 'MTS_NAVY';
  if (normalized === 'LTS') return 'LTS';
  return 'CWTS';
};

const withFallback = async (name, operation) => {
  try {
    return await operation();
  } catch (error) {
    console.warn(`Prisma ${name} operation failed. Using local fallback data: ${error.message}`);
    return fallback[name] || [];
  }
};

export async function listCollection(name) {
  if (name === 'accounts') {
    return withFallback(name, async () => prisma.user.findMany({ orderBy: { createdAt: 'desc' } }));
  }

  if (name === 'modules') {
    return withFallback(name, async () => prisma.module.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] }));
  }

  if (name === 'students') {
    return withFallback(name, async () => prisma.studentProfile.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true, component: true, section: true },
    }));
  }

  if (name === 'grades') {
    return withFallback(name, async () => prisma.grade.findMany({ orderBy: { createdAt: 'desc' } }));
  }

  if (name === 'assessments') {
    return withFallback(name, async () => {
      const quizzes = await prisma.quiz.findMany({
        orderBy: { createdAt: 'desc' },
        include: { module: true, questions: true },
      });
      return quizzes.map((quiz) => ({
        ...quiz,
        ...((quiz.data as Record<string, unknown>) || {}),
        data: undefined,
      }));
    });
  }

  if (name === 'notices' || name === 'supportTickets') {
    return fallback[name] || [];
  }

  const simpleList = (model) => withFallback(name, () => model.findMany({ orderBy: { createdAt: 'desc' } }));

  if (name === 'pending-registrations') return simpleList(prisma.pendingRegistration);
  if (name === 'training-groups') return simpleList(prisma.trainingGroup);
  if (name === 'attendance-records') return simpleList(prisma.attendanceRecord);
  if (name === 'attendance-sessions') return simpleList(prisma.attendanceSession);
  if (name === 'qualifying-results') return simpleList(prisma.qualifyingExamResult);
  if (name === 'component-state') return withFallback(name, () => prisma.componentApplicationState.findMany());
  if (name === 'audit-log') return simpleList(prisma.auditLogEntry);

  return fallback[name] || [];
}

export async function upsertCollectionRecord(name, lookup, payload) {
  const nextPayload = { ...payload, updatedAt: payload.updatedAt || now() };

  try {
    if (name === 'accounts') {
      const profileData = nextPayload.data || {};
      const explicitFields = ['surname', 'firstName', 'middleName', 'school', 'department', 'degreeProgram', 'yearLevel', 'major', 'gender', 'birthdate', 'houseStreetPurok', 'barangay', 'municipality', 'province', 'provincialAddress', 'contactNumber', 'currentAddress', 'cityAddress'];
      for (const field of explicitFields) {
        if (nextPayload[field] !== undefined) profileData[field] = nextPayload[field];
      }
      return await prisma.user.upsert({
        where: { email: nextPayload.email },
        update: {
          name: nextPayload.name,
          role: toUserRole(nextPayload.role),
          data: profileData,
        },
        create: {
          id: nextPayload.id,
          name: nextPayload.name || nextPayload.email,
          email: nextPayload.email,
          passwordHash: nextPayload.passwordHash || nextPayload.password || 'change-me',
          role: toUserRole(nextPayload.role),
          data: profileData,
        },
      });
    }

    if (name === 'modules') {
      return await prisma.module.upsert({
        where: { id: nextPayload.id },
        update: {
          title: nextPayload.title,
          description: nextPayload.description,
          hours: Number(nextPayload.hours) || null,
          isPublished: Boolean(nextPayload.published ?? nextPayload.isPublished),
        },
        create: {
          id: nextPayload.id,
          title: nextPayload.title || 'Untitled module',
          description: nextPayload.description,
          hours: Number(nextPayload.hours) || null,
          isPublished: Boolean(nextPayload.published ?? nextPayload.isPublished),
        },
      });
    }

    if (name === 'assessments') {
      const knownFields = ['id', 'title', 'description', 'moduleId', 'questions', 'updatedAt', 'createdAt'];
      const extras: Record<string, unknown> = {};
      for (const key of Object.keys(nextPayload)) {
        if (!knownFields.includes(key)) extras[key] = nextPayload[key];
      }
      const updatedQuizData = { ...((nextPayload.data as Record<string, unknown>) || {}), ...extras };
      return await prisma.quiz.upsert({
        where: { id: nextPayload.id || 'none' },
        update: {
          title: nextPayload.title,
          ...(nextPayload.description !== undefined ? { instructions: nextPayload.description } : {}),
          data: updatedQuizData,
        },
        create: {
          id: nextPayload.id,
          title: nextPayload.title || 'Untitled assessment',
          moduleId: nextPayload.moduleId || 'unknown',
          ...(nextPayload.description !== undefined ? { instructions: nextPayload.description } : {}),
          data: updatedQuizData,
        },
      });
    }

    if (name === 'students') {
      const user = await prisma.user.upsert({
        where: { email: nextPayload.email },
        update: { name: nextPayload.name, role: 'STUDENT' },
        create: {
          name: nextPayload.name || nextPayload.email,
          email: nextPayload.email,
          passwordHash: nextPayload.passwordHash || nextPayload.password || 'change-me',
          role: 'STUDENT',
        },
      });

      const component = await prisma.nSTPComponent.upsert({
        where: { type: toComponentType(nextPayload.component) },
        update: {},
        create: {
          type: toComponentType(nextPayload.component),
          name: nextPayload.component || 'CWTS',
        },
      });

      return await prisma.studentProfile.upsert({
        where: { studentNumber: nextPayload.studentId || nextPayload.studentNumber },
        update: {
          userId: user.id,
          componentId: component.id,
          course: nextPayload.course,
        },
        create: {
          id: nextPayload.id,
          userId: user.id,
          studentNumber: nextPayload.studentId || nextPayload.studentNumber,
          componentId: component.id,
          course: nextPayload.course,
        },
      });
    }

    const upsertSimple = (model) => model.upsert({
      where: { id: nextPayload.id || 'none' },
      update: { ...nextPayload, updatedAt: undefined },
      create: { ...nextPayload, updatedAt: undefined },
    });

    if (name === 'pending-registrations') return await upsertSimple(prisma.pendingRegistration);
    if (name === 'training-groups') return await upsertSimple(prisma.trainingGroup);
    if (name === 'attendance-records') return await upsertSimple(prisma.attendanceRecord);
    if (name === 'attendance-sessions') return await upsertSimple(prisma.attendanceSession);
    if (name === 'qualifying-results') return await upsertSimple(prisma.qualifyingExamResult);
    if (name === 'component-state') return await upsertSimple(prisma.componentApplicationState);
    if (name === 'audit-log') return await upsertSimple(prisma.auditLogEntry);
    if (name === 'notices' || name === 'supportTickets') {
      const items = fallback[name] || [];
      const index = items.findIndex((item) => Object.entries(lookup).every(([key, value]) => item[key] === value));
      if (index >= 0) items[index] = { ...items[index], ...nextPayload };
      else items.unshift(nextPayload);
      return index >= 0 ? items[index] : nextPayload;
    }
  } catch (error) {
    console.warn(`Prisma ${name} upsert failed. Using local fallback data: ${error.message}`);
  }

  const items = fallback[name] || [];
  const index = items.findIndex((item) => Object.entries(lookup).every(([key, value]) => item[key] === value));
  if (index >= 0) items[index] = { ...items[index], ...nextPayload };
  else items.unshift(nextPayload);
  return index >= 0 ? items[index] : nextPayload;
}

export async function batchUpsertRecords(name, records) {
  const results = [];
  for (const payload of records) {
    const lookup = payload.id
      ? { id: payload.id }
      : payload.studentId
        ? { studentId: payload.studentId }
        : payload.email
          ? { email: payload.email }
          : { id: `${name}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}` };
    const result = await upsertCollectionRecord(name, lookup, { ...lookup, ...payload });
    results.push(result);
  }
  return results;
}

export async function getAdminSummary() {
  const [students, modules, assessments, grades] = await Promise.all([
    listCollection('students'),
    listCollection('modules'),
    listCollection('assessments'),
    listCollection('grades'),
  ]);

  return {
    students: students.length,
    learningHours: modules.reduce((sum, module) => sum + (Number(module.hours) || 0), 0),
    assessments: assessments.length,
    releasedGrades: grades.filter((grade) => grade.released).length,
    totalGradeRecords: grades.length,
    reportsGenerated: 12,
    updatedAt: now(),
  };
}
