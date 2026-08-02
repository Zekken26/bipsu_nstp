import 'dotenv/config';
import { seedAdmin } from '../src/seed.js';
import prisma from '../src/db/prisma.js';

try {
  const result = await seedAdmin();
  if (result.reason === 'missing-configuration') process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
