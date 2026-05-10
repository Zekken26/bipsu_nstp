import { sendError } from '../../utils/apiResponse.js';
import { getAdminSummary, getDatabaseStatus, listCollection, upsertCollectionRecord } from './nstp.service.js';

const allowedCollections = ['accounts', 'modules', 'assessments', 'students', 'grades', 'notices', 'supportTickets'];

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
