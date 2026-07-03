import bcrypt from 'bcrypt';
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

const withFallback = async (name, operation) => {
  try {
    return await operation();
  } catch (error) {
    console.warn(`Prisma ${name} operation failed. Using local fallback data: ${error?.message || error}`);
    return fallback[name] || [];
  }
};

export async function listCollection(name) {
  if (name === 'accounts') {
    return withFallback(name, async () => prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { instructorProfile: true, coordinatorProfile: true },
    }));
  }

  if (name === 'modules') {
    return withFallback(name, async () => {
      const modules = await prisma.module.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] });
      return modules.map((mod) => ({
        ...mod,
        ...(mod.data || {}),
        data: undefined,
      }));
    });
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
        ...(quiz.data || {}),
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
      const explicitFields = ['surname', 'firstName', 'middleName', 'school', 'department', 'degreeProgram', 'yearLevel', 'major', 'gender', 'birthdate', 'houseStreetPurok', 'barangay', 'municipality', 'province', 'provincialAddress', 'contactNumber', 'currentAddress', 'cityAddress', 'title', 'bio', 'generalEducationComplete', 'preferredComponent', 'examTaken', 'examScore', 'component', 'componentAccessStatus'];
      for (const field of explicitFields) {
        if (nextPayload[field] !== undefined) profileData[field] = nextPayload[field];
      }
      let passwordHash = nextPayload.passwordHash;
      if (!passwordHash && nextPayload.password) {
        passwordHash = await bcrypt.hash(nextPayload.password, 10);
      }
      const userRole = toUserRole(nextPayload.role);
      const user = await prisma.user.upsert({
        where: { email: nextPayload.email },
        update: {
          name: nextPayload.name,
          role: userRole,
          data: profileData,
        },
        create: {
          id: nextPayload.id,
          name: nextPayload.name || nextPayload.email,
          email: nextPayload.email,
          passwordHash: passwordHash || 'change-me',
          role: userRole,
          data: profileData,
        },
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
        const component = profileData.componentId
          ? await prisma.nSTPComponent.findUnique({ where: { id: profileData.componentId } })
          : null;
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

      return user;
    }

    if (name === 'modules') {
      const moduleKnownFields = ['id', 'title', 'description', 'hours', 'published', 'isPublished', 'updatedAt', 'createdAt'];
      const moduleExtras = {};
      for (const key of Object.keys(nextPayload)) {
        if (!moduleKnownFields.includes(key)) moduleExtras[key] = nextPayload[key];
      }
      const updatedModuleData = { ...(nextPayload.data || {}), ...moduleExtras };
      return await prisma.module.upsert({
        where: { id: nextPayload.id },
        update: {
          title: nextPayload.title,
          description: nextPayload.description,
          hours: Number(nextPayload.hours) || null,
          isPublished: Boolean(nextPayload.published ?? nextPayload.isPublished),
          data: updatedModuleData,
        },
        create: {
          id: nextPayload.id,
          title: nextPayload.title || 'Untitled module',
          description: nextPayload.description,
          hours: Number(nextPayload.hours) || null,
          isPublished: Boolean(nextPayload.published ?? nextPayload.isPublished),
          data: updatedModuleData,
        },
      });
    }

    if (name === 'assessments') {
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
      let studentPasswordHash = nextPayload.passwordHash;
      if (!studentPasswordHash && nextPayload.password) {
        studentPasswordHash = await bcrypt.hash(nextPayload.password, 10);
      }
      const user = await prisma.user.upsert({
        where: { email: nextPayload.email },
        update: { name: nextPayload.name, role: 'STUDENT' },
        create: {
          name: nextPayload.name || nextPayload.email,
          email: nextPayload.email,
          passwordHash: studentPasswordHash || 'change-me',
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

      const studentKnownFields = ['id', 'studentId', 'studentNumber', 'userId', 'componentId', 'component', 'course', 'yearLevel', 'sectionId', 'email', 'password', 'passwordHash', 'name', 'updatedAt', 'createdAt'];
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
      if (regPayload.password && !regPayload.password.startsWith('$2b$')) {
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
      const existing = await prisma.grade.findFirst({ where: { studentId: nextPayload.studentId } });
      if (existing) {
        return prisma.grade.update({ where: { id: existing.id }, data: { ...nextPayload, updatedAt: undefined } });
      }
      return prisma.grade.create({ data: { id: nextPayload.id || `grade-${nextPayload.studentId}`, ...nextPayload, updatedAt: undefined } });
    }
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
    console.warn(`Prisma ${name} upsert failed. Using local fallback data: ${error?.message || error}`);
  }

  const items = fallback[name] || [];
  const index = items.findIndex((item) => Object.entries(lookup).every(([key, value]) => item[key] === value));
  if (index >= 0) items[index] = { ...items[index], ...nextPayload };
  else items.unshift(nextPayload);
  return index >= 0 ? items[index] : nextPayload;
}

export async function deleteCollectionRecord(name, id) {
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
    return null;
  }
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
    releasedGrades: grades.filter((grade) => grade.isReleased || grade.released).length,
    totalGradeRecords: grades.length,
    reportsGenerated: 12,
    updatedAt: now(),
  };
}
