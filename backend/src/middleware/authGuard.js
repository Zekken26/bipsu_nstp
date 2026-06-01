import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const roleAliases = {
  admin: 'admin',
  administrator: 'admin',
  ADMIN: 'admin',
  facilitator: 'facilitator',
  instructor: 'facilitator',
  speaker: 'facilitator',
  INSTRUCTOR: 'facilitator',
  student: 'student',
  STUDENT: 'student',
};

const allowedMunicipalities = ['Almeria', 'Biliran', 'Cabucgayan', 'Caibiran', 'Culaba', 'Kawayan', 'Maripipi', 'Naval'];

function base64UrlDecode(value) {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function safeJson(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function verifyHs256Jwt(token) {
  const [headerRaw, payloadRaw, signature] = String(token || '').split('.');
  if (!headerRaw || !payloadRaw || !signature) {
    throw new ApiError(401, 'Missing or malformed access token.', undefined, 'INVALID_TOKEN');
  }

  const header = safeJson(base64UrlDecode(headerRaw));
  if (header?.alg !== 'HS256') {
    throw new ApiError(401, 'Unsupported access token algorithm.', undefined, 'INVALID_TOKEN_ALGORITHM');
  }

  const expected = crypto
    .createHmac('sha256', env.jwtSecret)
    .update(`${headerRaw}.${payloadRaw}`)
    .digest('base64url');
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    throw new ApiError(401, 'Invalid access token signature.', undefined, 'INVALID_TOKEN_SIGNATURE');
  }

  const payload = safeJson(base64UrlDecode(payloadRaw));
  if (!payload) throw new ApiError(401, 'Invalid access token payload.', undefined, 'INVALID_TOKEN_PAYLOAD');
  if (payload.exp && Number(payload.exp) * 1000 <= Date.now()) {
    throw new ApiError(401, 'Access token has expired. Please sign in again.', undefined, 'TOKEN_EXPIRED');
  }

  return payload;
}

function splitMunicipalities(value) {
  const source = Array.isArray(value) ? value.join(',') : String(value || '');
  return source
    .split(',')
    .map((item) => item.trim())
    .filter((item) => allowedMunicipalities.includes(item));
}

function normalizeUser(raw = {}) {
  const role = roleAliases[raw.role] || roleAliases[String(raw.role || '').toLowerCase()] || null;
  return {
    id: String(raw.sub || raw.id || raw.userId || '').trim(),
    email: String(raw.email || '').trim(),
    name: String(raw.name || '').trim(),
    role,
    component: String(raw.component || '').trim(),
    municipalities: splitMunicipalities(raw.municipalities || raw.assignedMunicipalities),
    activeMunicipality: allowedMunicipalities.includes(raw.activeMunicipality || raw.municipality)
      ? raw.activeMunicipality || raw.municipality
      : null,
  };
}

function devHeaderUser(req) {
  return normalizeUser({
    id: req.headers['x-user-id'],
    role: req.headers['x-user-role'],
    municipalities: req.headers['x-user-municipalities'],
    activeMunicipality: req.headers['x-active-municipality'],
    email: req.headers['x-user-email'],
    name: req.headers['x-user-name'],
    component: req.headers['x-user-component'],
  });
}

export function authenticateRequest({ optional = false } = {}) {
  return (req, res, next) => {
    try {
      const authHeader = String(req.headers.authorization || '');
      const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

      if (bearer) {
        req.user = normalizeUser(verifyHs256Jwt(bearer));
      } else if (env.nodeEnv !== 'production') {
        req.user = devHeaderUser(req);
      }

      if (!req.user?.role && !optional) {
        throw new ApiError(401, 'Authentication is required for this API route.', undefined, 'AUTH_REQUIRED');
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function requireRole(...roles) {
  const allowed = new Set(roles);
  return (req, res, next) => {
    if (!req.user?.role) {
      return next(new ApiError(401, 'Authentication is required for this API route.', undefined, 'AUTH_REQUIRED'));
    }
    if (!allowed.has(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to access this resource.', { requiredRoles: roles }, 'FORBIDDEN_ROLE'));
    }
    return next();
  };
}

export function requireStudentOwnership({ bodyField = 'studentId', paramField = undefined } = {}) {
  return (req, res, next) => {
    if (req.user?.role !== 'student') return next();
    const target = String((paramField ? req.params[paramField] : undefined) || req.body?.[bodyField] || '').trim();
    if (target && target !== req.user.id) {
      return next(new ApiError(403, 'Students can only submit or view their own records.', undefined, 'FORBIDDEN_OWNER'));
    }
    return next();
  };
}

export function assertActiveMunicipalityAllowed(req) {
  if (req.user?.role !== 'facilitator') return;
  const active = req.user.activeMunicipality;
  if (active && !req.user.municipalities.includes(active)) {
    throw new ApiError(403, 'The selected municipality is outside your assigned scope.', undefined, 'FORBIDDEN_MUNICIPALITY');
  }
}

export function enforceActiveMunicipalityScope(req, res, next) {
  try {
    assertActiveMunicipalityAllowed(req);
    return next();
  } catch (error) {
    return next(error);
  }
}

export function assertPayloadMunicipalityAllowed(req, payload = {}) {
  if (req.user?.role !== 'facilitator') return;
  const municipality = String(payload.municipality || payload.groupMunicipality || payload.activeMunicipality || '').trim();
  if (municipality && !req.user.municipalities.includes(municipality)) {
    throw new ApiError(403, 'This record belongs to a municipality outside your assigned scope.', undefined, 'FORBIDDEN_MUNICIPALITY');
  }
  assertActiveMunicipalityAllowed(req);
}

export function getAllowedMunicipalities() {
  return allowedMunicipalities;
}
