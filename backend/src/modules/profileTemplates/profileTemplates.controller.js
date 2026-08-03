import { sendSuccess } from '../../utils/apiResponse.js';
import {
  activateProfileTemplate, createProfileTemplateDraft, deleteProfileTemplateDraft,
  duplicateProfileTemplate, listProfileTemplates, publishProfileTemplate, recordProfileExportEvent,
} from './profileTemplates.service.js';

export async function listTemplates(req, res) {
  return sendSuccess(res, await listProfileTemplates());
}

export async function createTemplateDraft(req, res) {
  const { name, configuration } = req.validated.body;
  return sendSuccess(res, await createProfileTemplateDraft(req.user.id, name, configuration), 201);
}

export async function publishTemplate(req, res) {
  return sendSuccess(res, await publishProfileTemplate(req.user.id, req.params.id));
}

export async function activateTemplate(req, res) {
  return sendSuccess(res, await activateProfileTemplate(req.user.id, req.params.id));
}

export async function duplicateTemplate(req, res) {
  return sendSuccess(res, await duplicateProfileTemplate(req.user.id, req.params.id), 201);
}

export async function removeTemplateDraft(req, res) {
  return sendSuccess(res, await deleteProfileTemplateDraft(req.user.id, req.params.id));
}

export async function recordExportEvent(req, res) {
  const { studentId, format } = req.validated.body;
  return sendSuccess(res, await recordProfileExportEvent(req.user.id, studentId, format), 201);
}
