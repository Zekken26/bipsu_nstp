import bcrypt from 'bcrypt';
import prisma from './db/prisma.js';
import { logger } from './utils/logger.js';

export async function seedAdmin({ prismaClient = prisma, hashPassword = bcrypt.hash } = {}) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin seeding.');
    return { created: false, reason: 'missing-configuration' };
  }

  try {
    const existing = await prismaClient.user.findUnique({ where: { email }, select: { id: true } });
    const adminName = process.env.ADMIN_NAME || 'Dr. Reynold G. Bustillo';

    if (existing) {
      logger.info(`Admin account already exists for ${email}; skipping seed.`);
      return { created: false, reason: 'already-exists' };
    }

    const passwordHash = await hashPassword(password, 10);

    await prismaClient.user.create({
      data: {
        email,
        name: adminName,
        passwordHash,
        role: 'ADMIN',
        data: {},
      },
      select: { id: true },
    });
    logger.info(`Admin account created for ${email}`);
    return { created: true };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to seed admin account');
    throw error;
  }
}
