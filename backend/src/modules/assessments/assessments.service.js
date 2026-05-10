import { listCollection } from '../nstp/nstp.service.js';

export function listAssessments() {
  return listCollection('assessments');
}
