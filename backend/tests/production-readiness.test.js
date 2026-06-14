import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

process.env.JWT_SECRET ||= 'development_test_secret_that_is_long_enough';
process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/nstp_test';

const { createApp } = await import('../src/app.js');

function signTestJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const headers = {
  admin: { 'x-user-id': 'admin-1', 'x-user-role': 'admin' },
  facilitator: {
    'x-user-id': 'facilitator-1',
    'x-user-role': 'facilitator',
    'x-user-municipalities': 'Naval',
    'x-active-municipality': 'Naval',
  },
  student: { 'x-user-id': 'student-demo-cwts', 'x-user-role': 'student', 'x-user-component': 'CWTS' },
};

test('protected API routes reject missing and wrong roles', async () => {
  await withServer(async (base) => {
    const missing = await fetch(`${base}/api/students`);
    assert.equal(missing.status, 401);

    const studentToStudents = await fetch(`${base}/api/students`, { headers: headers.student });
    assert.equal(studentToStudents.status, 403);

    const studentToAccounts = await fetch(`${base}/api/nstp/accounts`, { headers: headers.student });
    assert.equal(studentToAccounts.status, 403);
  });
});

test('local login issues a bearer token and /me returns the session', async () => {
  await withServer(async (base) => {
    const login = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nstp.edu', password: 'admin' }),
    });
    assert.equal(login.status, 200);
    const body = await login.json();
    assert.ok(body.data.token);
    assert.equal(body.data.user.role, 'admin');

    const me = await fetch(`${base}/api/auth/me`, {
      headers: { authorization: `Bearer ${body.data.token}` },
    });
    assert.equal(me.status, 200);
    const session = await me.json();
    assert.equal(session.data.user.role, 'admin');
  });
});

test('municipality scope rejects direct access outside facilitator assignment', async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/nstp/grades`, {
      headers: { ...headers.facilitator, 'x-active-municipality': 'Almeria' },
    });
    assert.equal(response.status, 403);
  });
});

test('assessment submission validation, ownership, and duplicate protection work', async () => {
  await withServer(async (base) => {
    const malformed = await fetch(`${base}/api/assessments/submissions`, {
      method: 'POST',
      headers: { ...headers.student, 'content-type': 'application/json' },
      body: JSON.stringify({ assessmentId: 'cwts-task-1' }),
    });
    assert.equal(malformed.status, 400);

    const wrongOwner = await fetch(`${base}/api/assessments/submissions`, {
      method: 'POST',
      headers: { ...headers.student, 'content-type': 'application/json' },
      body: JSON.stringify({ assessmentId: 'cwts-task-1', studentId: 'another-student', answers: {} }),
    });
    assert.equal(wrongOwner.status, 403);

    const payload = { assessmentId: 'cwts-task-1', studentId: 'student-demo-cwts', answers: { q1: 1 } };
    const requestHeaders = { ...headers.student, 'content-type': 'application/json', 'idempotency-key': 'assessment-dup-test' };
    const first = await fetch(`${base}/api/assessments/submissions`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(payload),
    });
    const second = await fetch(`${base}/api/assessments/submissions`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(payload),
    });
    assert.equal(first.status, 202);
    assert.equal(second.status, 409);
  });
});

test('upload validation blocks invalid files and duplicate upload spam', async () => {
  await withServer(async (base) => {
    const invalid = await fetch(`${base}/api/uploads`, {
      method: 'POST',
      headers: { ...headers.student, 'content-type': 'application/json' },
      body: JSON.stringify({ ownerId: 'student-demo-cwts', fileName: 'malware.exe', mimeType: 'application/x-msdownload', sizeBytes: 10 }),
    });
    assert.equal(invalid.status, 415);

    const payload = { ownerId: 'student-demo-cwts', fileName: 'proof.pdf', mimeType: 'application/pdf', sizeBytes: 1024, checksum: 'same' };
    const requestHeaders = { ...headers.student, 'content-type': 'application/json', 'idempotency-key': 'upload-dup-test' };
    const first = await fetch(`${base}/api/uploads`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(payload),
    });
    const second = await fetch(`${base}/api/uploads`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(payload),
    });
    assert.equal(first.status, 202);
    assert.equal(second.status, 409);
  });
});

test('expired or invalid bearer token is rejected', async () => {
  await withServer(async (base) => {
    const expired = signTestJwt({ sub: 'admin-1', role: 'admin', exp: Math.floor(Date.now() / 1000) - 10 });
    const response = await fetch(`${base}/api/db-test`, {
      headers: { authorization: `Bearer ${expired}` },
    });
    assert.equal(response.status, 401);
  });
});

test('admin export queue and audit log are protected and usable', async () => {
  await withServer(async (base) => {
    const exportResponse = await fetch(`${base}/api/nstp/exports/supportTickets`, {
      method: 'POST',
      headers: { ...headers.admin, 'idempotency-key': 'export-test' },
    });
    assert.equal(exportResponse.status, 202);

    const auditResponse = await fetch(`${base}/api/audit`, { headers: headers.admin });
    assert.equal(auditResponse.status, 200);
    const body = await auditResponse.json();
    assert.ok(Array.isArray(body.data));
  });
});

test('direct backend exports enforce admin super access and scoped roles', async () => {
  await withServer(async (base) => {
    const adminAll = await fetch(`${base}/api/nstp/exports/all?format=json`, { headers: headers.admin });
    assert.equal(adminAll.status, 200);
    assert.match(adminAll.headers.get('content-disposition'), /NSTP_all_AdminSuperAccess_/);
    const adminBody = await adminAll.json();
    assert.ok(adminBody.data.accounts);
    assert.ok(adminBody.data.students);
    assert.ok(adminBody.data.auditLogs);

    const facilitatorStudents = await fetch(`${base}/api/nstp/exports/students?format=csv&municipality=Naval`, { headers: headers.facilitator });
    assert.equal(facilitatorStudents.status, 200);
    assert.equal(facilitatorStudents.headers.get('x-nstp-export-scope'), 'Naval');
    assert.match(await facilitatorStudents.text(), /student/i);

    const studentRoster = await fetch(`${base}/api/nstp/exports/students?format=json`, { headers: headers.student });
    assert.equal(studentRoster.status, 403);

    const studentGrades = await fetch(`${base}/api/nstp/exports/grades?format=json`, { headers: headers.student });
    assert.equal(studentGrades.status, 200);
    const gradeBody = await studentGrades.json();
    assert.ok(Array.isArray(gradeBody.data));
  });
});
