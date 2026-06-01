const auditEntries = [];

function safeActor(req) {
  return {
    id: req.user?.id || String(req.headers['x-user-id'] || 'anonymous'),
    role: req.user?.role || String(req.headers['x-user-role'] || 'anonymous'),
    ip: req.ip || req.socket?.remoteAddress || 'unknown',
  };
}

export function addAuditEntry(req, action, recordType, recordId, detail = undefined) {
  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    recordType,
    recordId: String(recordId || ''),
    detail,
    actor: safeActor(req),
    path: req.originalUrl,
    method: req.method,
    createdAt: new Date().toISOString(),
  };
  auditEntries.unshift(entry);
  auditEntries.splice(500);
  return entry;
}

export function listAuditEntries({ limit = 100 } = {}) {
  return auditEntries.slice(0, limit);
}
