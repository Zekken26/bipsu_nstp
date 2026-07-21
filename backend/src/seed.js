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
    const passwordHash = await bcrypt.hash(password, 10);

    if (existing) {
      const name = email.split('@')[0];
      await prisma.user.update({
        where: { email },
        data: { passwordHash, role: 'ADMIN', name },
      });
      logger.info(`Admin password updated for ${email}`);
      return;
    }

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
