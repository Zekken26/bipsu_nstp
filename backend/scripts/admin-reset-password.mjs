import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../src/db/prisma.js';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_RESET_PASSWORD;
if (process.env.ADMIN_RESET_CONFIRM !== 'RESET_ADMIN_PASSWORD' || !email || !password) {
  console.error('Refusing password reset. Set ADMIN_EMAIL, ADMIN_RESET_PASSWORD, and ADMIN_RESET_CONFIRM=RESET_ADMIN_PASSWORD.');
  process.exitCode = 1;
} else {
  try {
    const result = await prisma.user.updateMany({ where: { email, role: 'ADMIN' }, data: { passwordHash: await bcrypt.hash(password, 10) } });
    if (result.count !== 1) { console.error('Refusing password reset: exactly one administrator matching ADMIN_EMAIL is required.'); process.exitCode = 1; }
    else console.log('Administrator password reset completed.');
  } finally { await prisma.$disconnect(); }
}
