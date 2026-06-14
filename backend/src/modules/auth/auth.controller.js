import { addAuditEntry } from '../../audit/auditLog.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { loginWithPassword, registerStudentAccount, sessionFromRequest } from './auth.service.js';

export async function getAuthStatus(req, res) {
  return sendSuccess(res, {
    configured: true,
    message: 'Auth module is ready. Login returns a backend-issued JWT for protected API routes.',
  });
}

export async function loginController(req, res) {
  try {
    const result = await loginWithPassword(req.body || {});
    req.user = {
      id: result.user.id,
      role: result.user.role,
      email: result.user.email,
      name: result.user.name,
      component: result.user.component,
      municipalities: result.user.municipalities || [],
      activeMunicipality: result.user.activeMunicipality || '',
    };
    addAuditEntry(req, 'auth.login.success', 'auth', result.user.id, `Login source: ${result.source}`);
    return res.json({ success: true, data: result });
  } catch (error) {
    addAuditEntry(req, 'auth.login.failed', 'auth', req.body?.email || 'unknown', error.code || error.message);
    throw error;
  }
}

export async function registerController(req, res) {
  const result = await registerStudentAccount(req.body || {});
  req.user = {
    id: result.user.id,
    role: result.user.role,
    email: result.user.email,
    name: result.user.name,
    component: result.user.component,
  };
  addAuditEntry(req, 'auth.register.success', 'auth', result.user.id, result.user.email);
  return res.status(201).json({ success: true, data: result });
}

export async function meController(req, res) {
  return res.json({
    success: true,
    data: {
      user: sessionFromRequest(req),
    },
  });
}

export async function logoutController(req, res) {
  addAuditEntry(req, 'auth.logout', 'auth', req.user?.id || 'unknown', 'Client requested logout.');
  return res.json({
    success: true,
    data: {
      message: 'Logged out locally. Clear the stored token on the client.',
    },
  });
}
