import { listGrades } from './grades.service.js';

export async function listGradesController(req, res) {
  return res.json(await listGrades(req));
}
