import prisma from '../../db/prisma.js';

export function listStudents() {
  return prisma.studentProfile.findMany({
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
}
