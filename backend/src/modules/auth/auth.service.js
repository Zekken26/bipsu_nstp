import prisma from '../../db/prisma.js';

export async function findUserByEmail(email) {
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}
