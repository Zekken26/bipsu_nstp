import { sendError, sendSuccess } from '../../utils/apiResponse.js';
import { getLearningModule, listLearningModules, updateLearningModule } from './modules.service.js';

export async function listModulesController(req, res) {
  const result = await listLearningModules();
  res.setHeader('X-Cache', result.cache);
  return res.json(result.data);
}

export async function getModuleController(req, res) {
  const result = await getLearningModule(req.params.id);
  if (!result) return sendError(res, 'Module not found', 404);

  res.setHeader('X-Cache', result.cache);
  return res.json(result.data);
}

export async function updateModuleController(req, res) {
  const updated = await updateLearningModule(req.params.id, req.body);
  if (!updated) return sendError(res, 'Module not found', 404);

  return sendSuccess(res, updated);
}
