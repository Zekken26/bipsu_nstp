import { listCollection } from '../nstp/nstp.service.js';

export function listGrades() {
  return listCollection('grades');
}
