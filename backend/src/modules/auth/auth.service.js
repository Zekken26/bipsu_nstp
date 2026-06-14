import prisma from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/apiError.js';
import { signJwt } from '../../utils/jwt.js';
import { hashPassword, needsPasswordRehash, verifyPassword } from '../../utils/password.js';

const demoUsers = [
  {
    id: 'admin-1',
    name: 'Administrator',
    email: 'admin@nstp.edu',
    password: 'admin',
    role: 'admin',
    municipalities: [],
  },
  {
    id: 'facilitator-1',
    name: 'Dr. Maria Elena Santos',
    email: 'facilitator@nstp.edu',
    password: 'facilitator',
    role: 'facilitator',
    component: 'CWTS',
    municipalities: ['Naval'],
    activeMunicipality: 'Naval',
  },
  {
    id: 'facilitator-demo-coastguard',
    name: 'Lt. Adrian Mercado',
    email: 'coastguard.facilitator@nstp.edu',
    password: 'facilitator',
    role: 'facilitator',
    component: 'CWTS-Coastguard',
    municipalities: ['Naval'],
    activeMunicipality: 'Naval',
  },
  {
    id: 'facilitator-demo-sunday',
    name: 'Prof. Elisa Cabal',
    email: 'sunday.facilitator@nstp.edu',
    password: 'facilitator',
    role: 'facilitator',
    component: 'CWTS-Sunday',
    municipalities: ['Naval'],
    activeMunicipality: 'Naval',
  },
  {
    id: 'facilitator-demo-lts',
    name: 'Prof. Daniel Flores',
    email: 'lts.facilitator@nstp.edu',
    password: 'facilitator',
    role: 'facilitator',
    component: 'LTS',
    municipalities: ['Naval'],
    activeMunicipality: 'Naval',
  },
  {
    id: 'facilitator-demo-mts',
    name: 'Capt. Ramon Villanueva',
    email: 'mts.facilitator@nstp.edu',
    password: 'facilitator',
    role: 'facilitator',
    component: 'MTS',
    municipalities: ['Naval'],
    activeMunicipality: 'Naval',
  },
  {
    id: 'student-demo-cwts',
    name: 'Ana Cruz',
    email: 'cwts.student@student.edu',
    password: 'student',
    role: 'student',
    component: 'CWTS',
    municipalities: [],
    municipality: 'Naval',
  },
  {
    id: 'student-demo-coastguard',
    name: 'Marco Rivera',
    email: 'coastguard.student@student.edu',
    password: 'student',
    role: 'student',
    component: 'CWTS-Coastguard',
    municipality: 'Naval',
  },
  {
    id: 'student-demo-sunday',
    name: 'Bea Castillo',
    email: 'sunday.student@student.edu',
    password: 'student',
    role: 'student',
    component: 'CWTS-Sunday',
    municipality: 'Naval',
  },
  {
    id: 'student-demo-lts',
    name: 'Luis Reyes',
    email: 'lts.student@student.edu',
    password: 'student',
    role: 'student',
    component: 'LTS',
    municipality: 'Almeria',
  },
  {
    id: 'student-demo-mts',
    name: 'Miguel Torres',
    email: 'mts.student@student.edu',
    password: 'student',
    role: 'student',
    component: 'MTS',
    municipality: 'Biliran',
  },
  {
    id: 'student-demo-common',
    name: 'Juan Dela Cruz',
    email: 'common.phase@student.edu',
    password: 'student',
    role: 'student',
    component: '',
    municipality: 'Naval',
  },
  {
    id: 'student-demo-1',
    name: 'Juan Dela Cruz',
    email: 'juan.dela-cruz@student.edu',
    password: 'student',
    role: 'student',
    component: 'MTS',
    municipality: 'Naval',
  },
];

function toAppRole(role) {
  const normalized = String(role || '').toUpperCase();
  if (normalized === 'ADMIN') return 'admin';
  if (normalized === 'INSTRUCTOR') return 'facilitator';
  return 'student';
}

function toDbRole(role) {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'admin') return 'ADMIN';
  if (normalized === 'facilitator' || normalized === 'instructor' || normalized === 'speaker') return 'INSTRUCTOR';
  return 'STUDENT';
}

function componentName(component) {
  const raw = component?.name || component?.type || component || '';
  if (raw === 'MTS_ARMY' || raw === 'MTS_NAVY') return 'MTS';
  if (raw === 'CWTS_COASTGUARD') return 'CWTS-Coastguard';
  if (raw === 'CWTS_SUNDAY') return 'CWTS-Sunday';
  return String(raw).replace(/_/g, ' ');
}

function sessionFromDbUser(user) {
  const role = toAppRole(user.role);
  const component = componentName(user.studentProfile?.component);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    component,
    studentId: user.studentProfile?.studentNumber,
    municipalities: role === 'facilitator' ? [] : [],
    activeMunicipality: '',
  };
}

function createTokenUser(sessionUser) {
  return {
    sub: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    role: sessionUser.role,
    component: sessionUser.component,
    municipalities: sessionUser.municipalities || [],
    activeMunicipality: sessionUser.activeMunicipality || '',
  };
}

function authResponse(sessionUser, source) {
  const token = signJwt(createTokenUser(sessionUser));
  return {
    token,
    tokenType: 'Bearer',
    expiresInSeconds: env.jwtExpiresInSeconds,
    user: sessionUser,
    source,
  };
}

async function findDbUser(email) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      studentProfile: { include: { component: true, section: true } },
      instructorProfile: true,
    },
  });
}

function demoLogin(email, password) {
  const demo = demoUsers.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
  if (!demo || demo.password !== password) return null;
  const { password: _password, ...sessionUser } = demo;
  return authResponse(sessionUser, 'demo-fallback');
}

export async function loginWithPassword({ email, password }) {
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.', undefined, 'AUTH_VALIDATION_ERROR');
  }

  try {
    const user = await findDbUser(String(email).trim().toLowerCase());
    if (!user) {
      const demo = demoLogin(email, password);
      if (demo) return demo;
      throw new ApiError(401, 'Invalid email or password.', undefined, 'INVALID_CREDENTIALS');
    }

    if (!verifyPassword(password, user.passwordHash)) {
      throw new ApiError(401, 'Invalid email or password.', undefined, 'INVALID_CREDENTIALS');
    }

    if (needsPasswordRehash(user.passwordHash)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password) },
      }).catch(() => undefined);
    }

    return authResponse(sessionFromDbUser(user), 'database');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const demo = demoLogin(email, password);
    if (demo) return demo;
    throw new ApiError(503, 'Authentication database is unavailable. Check local PostgreSQL or use a seeded demo account.', undefined, 'AUTH_DATABASE_UNAVAILABLE');
  }
}

export async function registerStudentAccount(payload = {}) {
  const email = String(payload.email || '').trim().toLowerCase();
  const name = String(payload.name || `${payload.firstName || ''} ${payload.middleName || ''} ${payload.surname || ''}`).replace(/\s+/g, ' ').trim();
  const password = String(payload.password || '');
  const studentNumber = String(payload.studentId || payload.studentNumber || '').trim();

  if (!email || !name || !password || !studentNumber) {
    throw new ApiError(400, 'Name, email, password, and student ID are required.', undefined, 'AUTH_VALIDATION_ERROR');
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists.', undefined, 'EMAIL_ALREADY_EXISTS');
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        role: toDbRole('student'),
        studentProfile: {
          create: {
            studentNumber,
            yearLevel: payload.yearLevel,
            course: payload.degreeProgram || payload.course,
          },
        },
      },
      include: {
        studentProfile: { include: { component: true, section: true } },
        instructorProfile: true,
      },
    });

    return authResponse(sessionFromDbUser(user), 'database');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, 'Registration database is unavailable. Please check local PostgreSQL.', undefined, 'AUTH_DATABASE_UNAVAILABLE');
  }
}

export function sessionFromRequest(req) {
  if (!req.user?.id) {
    throw new ApiError(401, 'Authentication is required.', undefined, 'AUTH_REQUIRED');
  }
  return {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    component: req.user.component,
    municipalities: req.user.municipalities || [],
    activeMunicipality: req.user.activeMunicipality || '',
  };
}

export async function findUserByEmail(email) {
  if (!email) return null;
  return findDbUser(email);
}
