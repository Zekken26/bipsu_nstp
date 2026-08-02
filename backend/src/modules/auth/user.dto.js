// Keep authentication fields out of every API-facing user shape. Prisma
// selections are exported so callers cannot accidentally return raw User rows.
export const adminAccountSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  instructorProfile: {
    select: { id: true, employeeNumber: true, department: true, title: true },
  },
  coordinatorProfile: {
    select: { id: true, employeeNumber: true, componentId: true },
  },
};

export const studentSelfSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  data: true,
  createdAt: true,
  updatedAt: true,
  studentProfile: {
    select: {
      id: true, studentNumber: true, yearLevel: true, course: true,
      sectionId: true, componentId: true, data: true, createdAt: true, updatedAt: true,
    },
  },
};

export const rosterUserSelect = {
  id: true,
  name: true,
  email: true,
};

export const adminStudentSelect = {
  id: true,
  studentNumber: true,
  yearLevel: true,
  course: true,
  sectionId: true,
  componentId: true,
  createdAt: true,
  updatedAt: true,
  user: { select: rosterUserSelect },
  component: { select: { id: true, name: true, type: true } },
  section: { select: { id: true, code: true, name: true, schoolYear: true, semester: true } },
};

export const pendingRegistrationSelect = {
  id: true, studentId: true, surname: true, firstName: true, middleName: true,
  name: true, email: true, school: true, department: true, degreeProgram: true,
  yearLevel: true, major: true, gender: true, birthdate: true, houseStreetPurok: true,
  barangay: true, province: true, currentAddress: true, cityAddress: true,
  provincialAddress: true, contactNumber: true, municipality: true,
  assignedMunicipality: true, createdAt: true,
};

export function toAdminAccountDto(user) {
  if (!user) return user;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    instructorProfile: user.instructorProfile || null,
    coordinatorProfile: user.coordinatorProfile || null,
  };
}

export function toStudentSelfProfileDto(user) {
  if (!user) return user;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    data: user.data || {},
    studentProfile: user.studentProfile || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toAdminStudentDto(student) {
  return student;
}
