import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables');
  process.exit(1);
}

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
