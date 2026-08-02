import bcrypt from 'bcrypt';
import prisma from './db/prisma.js';
import { logger } from './utils/logger.js';

export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin seeding.');
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    const adminName = process.env.ADMIN_NAME || 'Dr. Reynold G. Bustillo';

    if (existing) {
      logger.info(`Admin account already exists for ${email}; skipping seed.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
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
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to seed admin account');
  }
}
