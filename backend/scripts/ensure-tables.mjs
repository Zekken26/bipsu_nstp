import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function tableExists(table) {
  try {
    await prisma.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
    return true;
  } catch {
    return false;
  }
}

async function runMigrationSql(migrationName) {
  const sqlPath = join(__dirname, '..', 'prisma', 'migrations', migrationName, 'migration.sql');
  const sql = readFileSync(sqlPath, 'utf-8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await prisma.$queryRawUnsafe(stmt + ';');
  }
  console.log(`Executed SQL for migration: ${migrationName}`);
}

const REQUIRED_TABLES = [
  { table: 'coordinator_profile', migration: '20260703023044_add_coordinator_role' },
];

async function main() {
  for (const { table, migration } of REQUIRED_TABLES) {
    const exists = await tableExists(table);
    if (!exists) {
      console.log(`Table "${table}" is missing. Applying migration ${migration}...`);
      try {
        await runMigrationSql(migration);
        console.log(`Table "${table}" created successfully.`);
      } catch (err) {
        console.error(`Failed to create table "${table}": ${err.message}`);
        process.exit(1);
      }
    } else {
      console.log(`Table "${table}" exists.`);
    }
  }
}

main()
  .catch((err) => {
    console.error('Failed to ensure tables:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
