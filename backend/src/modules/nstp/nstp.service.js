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
  accounts: [
    { id: 'admin-1', name: 'Administrator', email: 'admin@nstp.edu', password: 'admin', role: 'admin' },
    { id: 'facilitator-1', name: 'Dr. Maria Elena Santos', email: 'facilitator@nstp.edu', password: 'facilitator', role: 'facilitator', title: 'NSTP Program Director', component: 'CWTS', municipalities: ['Naval'] },
    { id: 'facilitator-demo-coastguard', name: 'Lt. Adrian Mercado', email: 'coastguard.facilitator@nstp.edu', password: 'facilitator', role: 'facilitator', component: 'CWTS-Coastguard', municipalities: ['Naval'] },
    { id: 'facilitator-demo-sunday', name: 'Prof. Elisa Cabal', email: 'sunday.facilitator@nstp.edu', password: 'facilitator', role: 'facilitator', component: 'CWTS-Sunday', municipalities: ['Naval'] },
    { id: 'facilitator-demo-lts', name: 'Prof. Daniel Flores', email: 'lts.facilitator@nstp.edu', password: 'facilitator', role: 'facilitator', component: 'LTS', municipalities: ['Naval'] },
    { id: 'facilitator-demo-mts', name: 'Capt. Ramon Villanueva', email: 'mts.facilitator@nstp.edu', password: 'facilitator', role: 'facilitator', component: 'MTS', municipalities: ['Naval'] },
    { id: 'student-demo-1', studentId: '2024-0001', name: 'Juan Dela Cruz', email: 'juan.dela-cruz@student.edu', password: 'student', role: 'student', component: 'MTS', generalEducationComplete: true, preferredComponent: 'MTS', examTaken: true, examScore: 92 },
  ],
  modules: [
    { id: 'm1', title: 'Module 1: Introduction to NSTP', description: 'Understanding NSTP, legal basis, and civic purpose.', hours: 3, difficulty: 'Beginner', sections: [], updatedAt: now() },
    { id: 'm2', title: 'Module 2: Citizenship Training', description: 'Rights, responsibilities, and civic duties.', hours: 3, difficulty: 'Beginner', sections: [], updatedAt: now() },
    { id: 'm3', title: 'Module 3: Community Development', description: 'Community profiling, planning, and service.', hours: 4, difficulty: 'Intermediate', sections: [], updatedAt: now() },
  ],
  assessments: [
    { id: 'asmt-nstp-intro', title: 'Module 1 Quiz', type: 'quiz', description: 'NSTP fundamentals.', moduleId: 'm1', timeLimit: 15, passingScore: 70, ownerId: 'admin-1', ownerName: 'Administrator', ownerRole: 'admin', status: 'published', questions: [], updatedAt: now() },
  ],
  students: [
    { id: 'student-1', studentId: '2024-1001', name: 'Maria Santos', email: 'maria.santos@university.edu', component: 'CWTS', municipality: 'Naval', progress: 85, assessments: 7, status: 'active', notes: 'Consistent participation.', updatedAt: now() },
    { id: 'student-demo-coastguard', studentId: '2026-CG01', name: 'Marco Rivera', email: 'coastguard.student@student.edu', component: 'CWTS-Coastguard', municipality: 'Naval', progress: 84, assessments: 7, status: 'active', notes: 'Maritime component learner.', updatedAt: now() },
    { id: 'student-demo-sunday', studentId: '2026-SU01', name: 'Bea Castillo', email: 'sunday.student@student.edu', component: 'CWTS-Sunday', municipality: 'Naval', progress: 82, assessments: 7, status: 'active', notes: 'Sunday CWTS learner.', updatedAt: now() },
    { id: 'student-2', studentId: '2024-1002', name: 'Juan Dela Cruz', email: 'juan.delacruz@university.edu', component: 'LTS', municipality: 'Naval', progress: 92, assessments: 8, status: 'active', notes: 'Ready for peer mentoring.', updatedAt: now() },
  ],
  grades: [
    { studentId: '2024-0001', prelim: 88, midterm: 90, final: 0, remarks: 'In Progress', released: true, updatedAt: now() },
  ],
  notices: [],
  supportTickets: [],
};

const toUserRole = (role) => {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'admin') return 'ADMIN';
  if (normalized === 'instructor' || normalized === 'facilitator' || normalized === 'speaker') return 'INSTRUCTOR';
  return 'STUDENT';
};

const toComponentType = (component) => {
  const normalized = String(component || '').toUpperCase().replace(/\s+/g, '_').replace(/[()]/g, '');
  if (normalized === 'CWTS_COASTGUARD') return 'CWTS_COASTGUARD';
  if (normalized === 'CWTS_SUNDAY') return 'CWTS_SUNDAY';
  if (normalized === 'MTS' || normalized.includes('ARMY') || normalized.includes('NAVY')) return 'MTS';
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
    return withFallback(name, async () => prisma.grade.findMany({
      orderBy: { createdAt: 'desc' },
      include: { student: { include: { section: true, component: true, user: true } } },
    }));
  }

  if (name === 'assessments') {
    return withFallback(name, async () => prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' },
      include: { module: { include: { component: true } }, questions: true },
    }));
  }

  return fallback[name] || [];
}

export async function upsertCollectionRecord(name, lookup, payload) {
  const nextPayload = { ...payload, updatedAt: payload.updatedAt || now() };

  try {
    if (name === 'accounts') {
      return await prisma.user.upsert({
        where: { email: nextPayload.email },
        update: {
          name: nextPayload.name,
          role: toUserRole(nextPayload.role),
        },
        create: {
          id: nextPayload.id,
          name: nextPayload.name || nextPayload.email,
          email: nextPayload.email,
          passwordHash: nextPayload.passwordHash || nextPayload.password || 'change-me',
          role: toUserRole(nextPayload.role),
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
  } catch (error) {
    console.warn(`Prisma ${name} upsert failed. Using local fallback data: ${error.message}`);
  }

  const items = fallback[name] || [];
  const index = items.findIndex((item) => Object.entries(lookup).every(([key, value]) => item[key] === value));
  if (index >= 0) items[index] = { ...items[index], ...nextPayload };
  else items.unshift(nextPayload);
  return index >= 0 ? items[index] : nextPayload;
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
