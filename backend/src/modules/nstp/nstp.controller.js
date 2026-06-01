import { sendError } from '../../utils/apiResponse.js';
import { enqueueJob } from '../../queue/requestQueue.js';
import { addAuditEntry } from '../../audit/auditLog.js';
import { assertPayloadMunicipalityAllowed } from '../../middleware/authGuard.js';
import { applyFacilitatorMunicipalityScope } from '../../utils/facilitatorScope.js';
import { assertAllowedCollection, validateCollectionPayload } from '../../utils/nstpValidation.js';
import { getAdminSummary, getDatabaseStatus, listCollection, upsertCollectionRecord } from './nstp.service.js';

export async function getDbTest(req, res) {
  const status = await getDatabaseStatus();
  return res.json(status);
}

export async function getAdminSummaryController(req, res) {
  return res.json(await getAdminSummary());
}

export async function listNstpCollection(req, res) {
  assertAllowedCollection(req.params.collection);

  const rows = await listCollection(req.params.collection);
  if (req.params.collection === 'grades' && req.user?.role === 'student') {
    return res.json(rows.filter((grade) => {
      const studentUserId = grade?.student?.user?.id || grade?.student?.userId;
      const studentProfileId = grade?.student?.id || grade?.studentId;
      const studentNumber = grade?.student?.studentNumber || grade?.studentId;
      return [studentUserId, studentProfileId, studentNumber].filter(Boolean).includes(req.user.id);
    }));
  }
  if (req.params.collection === 'students' || req.params.collection === 'grades') {
    return res.json(applyFacilitatorMunicipalityScope(rows, req));
  }
  if (req.params.collection === 'assessments' && req.user?.role === 'student') {
    return res.json(rows.filter((assessment) => assessment.status === undefined || assessment.status === 'published' || assessment.status === 'Published'));
  }
  return res.json(rows);
}

export async function upsertNstpCollectionRecord(req, res) {
  assertAllowedCollection(req.params.collection);

  const payload = req.body || {};
  validateCollectionPayload(req.params.collection, payload);
  assertPayloadMunicipalityAllowed(req, payload);
  const lookup = payload.id
    ? { id: payload.id }
    : payload.studentId
      ? { studentId: payload.studentId }
      : payload.email
        ? { email: payload.email }
        : { id: `${req.params.collection}-${Date.now()}` };

  const record = await upsertCollectionRecord(req.params.collection, lookup, { ...lookup, ...payload });
  addAuditEntry(req, `${req.params.collection}.upsert`, req.params.collection, record.id || record.studentId || record.email, 'NSTP collection record saved.');
  return res.status(201).json(record);
}

export async function createNstpExportJob(req, res) {
  assertAllowedCollection(req.params.collection);

  const job = enqueueJob('reportExports', async () => {
    const sourceRows = await listCollection(req.params.collection);
    const rows = ['students', 'grades'].includes(req.params.collection)
      ? applyFacilitatorMunicipalityScope(sourceRows, req)
      : sourceRows;
    return {
      collection: req.params.collection,
      rowCount: rows.length,
      generatedAt: new Date().toISOString(),
    };
  });

  return res.status(202).json({
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      message: 'Export generation has been queued. Check the queue job endpoint for status.',
    },
  });
  addAuditEntry(req, 'export.queued', req.params.collection, job.id, `Queued export for ${req.params.collection}.`);
}
