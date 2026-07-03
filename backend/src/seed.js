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
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      logger.info(`Admin account already exists for ${email}`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
        passwordHash,
        role: 'ADMIN',
        data: {},
      },
    });
    logger.info(`Admin account created for ${email}`);
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to seed admin account');
  }
}
