import { sendSuccess } from '../../utils/apiResponse.js';
import { addAuditEntry } from '../../audit/auditLog.js';

export async function getAuthStatus(req, res) {
  return sendSuccess(res, {
    configured: true,
    message: 'Auth module is ready for login/register implementation.',
  });
}

export async function authNotImplemented(req, res) {
  addAuditEntry(req, `auth.${req.path.includes('register') ? 'register' : 'login'}.attempt`, 'auth', req.body?.email || req.headers['x-user-id'] || 'unknown', 'Protected auth endpoint reached before credential provider implementation.');
  return res.status(501).json({
    success: false,
    error: 'This auth endpoint is protected but not implemented yet.',
    code: 'AUTH_ENDPOINT_NOT_IMPLEMENTED',
  });
}
