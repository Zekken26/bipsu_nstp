import { sendError } from '../../utils/apiResponse.js';
import { enqueueJob } from '../../queue/requestQueue.js';
import { addAuditEntry } from '../../audit/auditLog.js';
import { assertPayloadMunicipalityAllowed } from '../../middleware/authGuard.js';
import { applyFacilitatorMunicipalityScope } from '../../utils/facilitatorScope.js';
import { assertAllowedCollection, validateCollectionPayload } from '../../utils/nstpValidation.js';
import { getAdminSummary, getDatabaseStatus, listCollection, upsertCollectionRecord } from './nstp.service.js';
import {
  EXPORTABLE_COLLECTIONS,
  buildExportDataset,
  buildExportFilename,
  exportScopeFromQuery,
  extractExportFilters,
  renderCsvExport,
  renderExcelXmlExport,
  renderHtmlExport,
  renderJsonExport,
} from './nstpExport.service.js';

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
  if (req.params.collection !== 'all' && !EXPORTABLE_COLLECTIONS.includes(req.params.collection)) {
    assertAllowedCollection(req.params.collection);
  }

  const job = enqueueJob('reportExports', async () => {
    const dataset = await buildExportDataset(req.params.collection, req, extractExportFilters(req.query));
    return {
      collection: req.params.collection,
      rowCount: dataset.rowCount,
      generatedAt: new Date().toISOString(),
    };
  });
  addAuditEntry(req, 'export.queued', req.params.collection, job.id, `Queued export for ${req.params.collection}.`);

  return res.status(202).json({
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      message: 'Export generation has been queued. Check the queue job endpoint for status.',
    },
  });
}

export async function downloadNstpExport(req, res) {
  const collection = req.params.collection;
  if (collection !== 'all' && !EXPORTABLE_COLLECTIONS.includes(collection)) {
    assertAllowedCollection(collection);
  }

  const format = String(req.query.format || 'csv').toLowerCase();
  const normalizedFormat = format === 'xlsx' ? 'excel' : format;
  const supported = new Set(['csv', 'json', 'excel', 'html', 'print']);
  if (!supported.has(normalizedFormat)) {
    return sendError(res, 'Unsupported export format.', 400, { supported: [...supported, 'xlsx'] });
  }

  const filters = extractExportFilters(req.query);
  const scope = exportScopeFromQuery(req.query, req.user?.role === 'admin' ? 'AdminSuperAccess' : req.user?.role || 'Scoped');
  const dataset = await buildExportDataset(collection, req, filters);
  const metadata = {
    title: `NSTP ${collection === 'all' ? 'All Records' : collection} Export`,
    dataType: collection,
    scope,
    generatedBy: req.user?.name || req.user?.email || req.user?.id || req.user?.role || 'System user',
    filters,
  };

  const content = normalizedFormat === 'json'
    ? renderJsonExport(dataset, metadata)
    : normalizedFormat === 'excel'
      ? renderExcelXmlExport(dataset, metadata)
      : normalizedFormat === 'html' || normalizedFormat === 'print'
        ? renderHtmlExport(dataset, metadata)
        : renderCsvExport(dataset);

  const filename = buildExportFilename(collection, scope, normalizedFormat);
  const contentType = normalizedFormat === 'json'
    ? 'application/json; charset=utf-8'
    : normalizedFormat === 'excel'
      ? 'application/vnd.ms-excel; charset=utf-8'
      : normalizedFormat === 'html' || normalizedFormat === 'print'
        ? 'text/html; charset=utf-8'
        : 'text/csv; charset=utf-8';

  addAuditEntry(req, 'export.downloaded', collection, filename, `${dataset.rowCount} row(s) exported as ${normalizedFormat.toUpperCase()} with scope ${scope}.`);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('X-NSTP-Export-Rows', String(dataset.rowCount));
  res.setHeader('X-NSTP-Export-Scope', scope);
  return res.send(content);
}
