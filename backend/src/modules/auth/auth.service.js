import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../db/prisma.js';
import { env } from '../../config/env.js';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: '7d' },
  );
}

export async function registerUser(payload) {
  const {
    surname, firstName, middleName,
    email, password,
    studentId, school, department, degreeProgram, yearLevel, major,
    gender, birthdate,
    houseStreetPurok, barangay, municipality, province, provincialAddress,
    contactNumber,
  } = payload;

  const name = [firstName, middleName, surname].filter(Boolean).join(' ').trim();
  if (!name || !email || !password || !studentId) {
    const err = new Error('Name, email, password, and student ID are required.');
    err.statusCode = 400;
    throw err;
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const existingStudent = await prisma.studentProfile.findUnique({ where: { studentNumber: studentId } });
  if (existingStudent) {
    const err = new Error('This student ID is already registered.');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'STUDENT',
      data: {
        surname,
        firstName,
        middleName,
        school,
        department,
        degreeProgram,
        yearLevel,
        major: major || null,
        gender,
        birthdate,
        houseStreetPurok,
        barangay,
        municipality,
        province,
        provincialAddress,
        contactNumber,
      },
      studentProfile: {
        create: {
          studentNumber: studentId,
          yearLevel,
          course: degreeProgram,
        },
      },
    },
    include: { studentProfile: true },
  });

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      studentId: user.studentProfile?.studentNumber,
      ...(user.data || {}),
    },
  };
}

export async function loginUser(identifier, password) {
  if (!identifier || !password) {
    const err = new Error('Identifier and password are required.');
    err.statusCode = 400;
    throw err;
  }

  let user = await prisma.user.findUnique({
    where: { email: identifier },
    include: { studentProfile: true },
  });

  if (!user) {
    user = await prisma.user.findFirst({
      where: { studentProfile: { studentNumber: identifier } },
      include: { studentProfile: true },
    });
  }

  if (!user) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user);
  const data = (user.data || {});

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      studentId: user.studentProfile?.studentNumber,
      ...data,
    },
  };
}
