import { sendError, sendSuccess } from '../../utils/apiResponse.js';
import { batchUpsertRecords, deleteCollectionRecord, getAdminSummary, getDatabaseStatus, listCollection, upsertCollectionRecord } from './nstp.service.js';

const allowedCollections = ['accounts', 'modules', 'assessments', 'students', 'grades', 'notices', 'supportTickets', 'pending-registrations', 'training-groups', 'attendance-records', 'attendance-sessions', 'qualifying-results', 'component-state', 'audit-log'];

export async function getDbTest(req, res) {
  const status = await getDatabaseStatus();
  return res.json(status);
}

export async function getAdminSummaryController(req, res) {
  return res.json(await getAdminSummary());
}

export async function listNstpCollection(req, res) {
  if (!allowedCollections.includes(req.params.collection)) {
    return sendError(res, 'Unknown collection', 404);
  }

  return res.json(await listCollection(req.params.collection));
}

export async function upsertNstpCollectionRecord(req, res) {
  if (!allowedCollections.includes(req.params.collection)) {
    return sendError(res, 'Unknown collection', 404);
  }

  const payload = req.body || {};
  const lookup = payload.id
    ? { id: payload.id }
    : payload.studentId
      ? { studentId: payload.studentId }
      : payload.email
        ? { email: payload.email }
        : { id: `${req.params.collection}-${Date.now()}` };

  const record = await upsertCollectionRecord(req.params.collection, lookup, { ...lookup, ...payload });
  return res.status(201).json(record);
}

export async function batchUpsertNstpCollectionRecords(req, res) {
  if (!allowedCollections.includes(req.params.collection)) {
    return sendError(res, 'Unknown collection', 404);
  }

  const records = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return sendError(res, 'Expected a non-empty array of records.', 400);
  }

  const results = await batchUpsertRecords(req.params.collection, records);
  return sendSuccess(res, { upserted: results.length });
}

export async function deleteNstpCollectionRecord(req, res) {
  if (!allowedCollections.includes(req.params.collection)) {
    return sendError(res, 'Unknown collection', 404);
  }

  const { id } = req.params;
  if (!id) {
    return sendError(res, 'Record ID is required.', 400);
  }

  const result = await deleteCollectionRecord(req.params.collection, id);
  if (!result) {
    return sendError(res, 'Record not found or could not be deleted.', 404);
  }

  return sendSuccess(res, { deleted: result.id || id });
}
