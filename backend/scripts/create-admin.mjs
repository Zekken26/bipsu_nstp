import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const email = 'bipsu_ntsp_admin@bipsu.edu.ph';
const password = 'bipsu_nstp2026';

const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  console.log('Admin already exists:', email);
  await prisma.$disconnect();
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 10);

const user = await prisma.user.create({
  data: {
    name: 'Dr. Reynold Garcia Bustillo',
    email,
    passwordHash,
    role: 'ADMIN',
    data: {
      title: 'NSTP Director',
      subtitle: 'Office of the National Service Training Program',
      contactNumber: '',
    },
  },
});

console.log('Admin created:', user.email);
await prisma.$disconnect();
