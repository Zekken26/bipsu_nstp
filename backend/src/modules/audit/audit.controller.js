import { listAuditEntries } from '../../audit/auditLog.js';

export async function listAuditLogController(req, res) {
  const limit = Math.min(250, Math.max(1, Number(req.query.limit || 100)));
  return res.json({
    success: true,
    data: listAuditEntries({ limit }),
  });
}
