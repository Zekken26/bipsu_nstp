import { listCollection } from '../nstp/nstp.service.js';
import { applyFacilitatorMunicipalityScope } from '../../utils/facilitatorScope.js';

export async function listGrades(req) {
  const grades = await listCollection('grades');
  if (req.user?.role === 'student') {
    return grades.filter((grade) => {
      const studentUserId = grade?.student?.user?.id || grade?.student?.userId;
      const studentProfileId = grade?.student?.id || grade?.studentId;
      const studentNumber = grade?.student?.studentNumber || grade?.studentId;
      return [studentUserId, studentProfileId, studentNumber].filter(Boolean).includes(req.user.id);
    });
  }
  return applyFacilitatorMunicipalityScope(grades, req);
}
