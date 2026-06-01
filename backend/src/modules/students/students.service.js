import prisma from '../../db/prisma.js';
import { applyFacilitatorMunicipalityScope } from '../../utils/facilitatorScope.js';

export async function listStudents(req) {
  const students = await prisma.studentProfile.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      component: true,
      section: true,
    },
  });
  return applyFacilitatorMunicipalityScope(students, req);
}
