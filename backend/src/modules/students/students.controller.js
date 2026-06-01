import { listStudents } from './students.service.js';

export async function getStudents(req, res) {
  return res.json(await listStudents(req));
}
