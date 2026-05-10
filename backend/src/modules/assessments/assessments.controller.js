import { listAssessments } from './assessments.service.js';

export async function listAssessmentsController(req, res) {
  return res.json(await listAssessments());
}
