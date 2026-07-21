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

async function runMigrationSql(migrationName, tableName) {
  const sqlPath = join(__dirname, '..', 'prisma', 'migrations', migrationName, 'migration.sql');
  const sql = readFileSync(sqlPath, 'utf-8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const tableStatements = statements.filter((s) =>
    s.toLowerCase().includes(`"${tableName.toLowerCase()}"`)
  );

  if (tableStatements.length === 0) {
    throw new Error(`No statements found for table "${tableName}" in migration ${migrationName}`);
  }

  for (const stmt of tableStatements) {
    await prisma.$queryRawUnsafe(stmt + ';');
  }
  console.log(`Executed ${tableStatements.length} statement(s) for table "${tableName}".`);
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
        await runMigrationSql(migration, table);
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
