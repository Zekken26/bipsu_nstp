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
    const adminName = process.env.ADMIN_NAME || 'Dr. Reynold G. Bustillo';

    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { passwordHash, role: 'ADMIN', name: adminName },
      });
      logger.info(`Admin password updated for ${email}`);
      return;
    }

    await prisma.user.create({
      data: {
        email,
        name: adminName,
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
