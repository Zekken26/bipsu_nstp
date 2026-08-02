import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seedAdmin } from '../src/seed.js';

test('admin seed creates only a missing administrator and never overwrites a restart password', async () => {
  const users = new Map();
  const prismaClient = { user: {
    findUnique: async ({ where }) => users.get(where.email) || null,
    create: async ({ data }) => { users.set(data.email, { id: 'admin-1', ...data }); return users.get(data.email); },
  } };
  const originalEmail = process.env.ADMIN_EMAIL; const originalPassword = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_EMAIL = 'admin@example.test'; process.env.ADMIN_PASSWORD = 'first-password';
  try {
    assert.deepEqual(await seedAdmin({ prismaClient, hashPassword: async (value) => `hash:${value}` }), { created: true });
    const firstHash = users.get(process.env.ADMIN_EMAIL).passwordHash;
    process.env.ADMIN_PASSWORD = 'different-password';
    assert.deepEqual(await seedAdmin({ prismaClient, hashPassword: async (value) => `hash:${value}` }), { created: false, reason: 'already-exists' });
    assert.equal(users.get(process.env.ADMIN_EMAIL).passwordHash, firstHash);
  } finally { process.env.ADMIN_EMAIL = originalEmail; process.env.ADMIN_PASSWORD = originalPassword; }
});
