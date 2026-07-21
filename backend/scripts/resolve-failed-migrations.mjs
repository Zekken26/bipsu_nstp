import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'prisma', 'migrations');

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8', ...opts });
}

function getFailedMigration(stderr, stdout) {
  const combined = stderr + stdout;
  const match = combined.match(/The\s+`([^`]+)`\s+migration/);
  return match ? match[1] : null;
}

function executeMigrationSql(migrationName) {
  const sqlPath = join(MIGRATIONS_DIR, migrationName, 'migration.sql');
  const sql = readFileSync(sqlPath, 'utf-8');
  const tmpFile = join(tmpdir(), `${migrationName}.sql`);
  writeFileSync(tmpFile, sql, 'utf-8');
  try {
    console.log(`Executing SQL for ${migrationName} directly...`);
    run(`npx prisma db execute --file "${tmpFile}"`);
    console.log('SQL executed successfully.');
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

function deployFailed(retry = false) {
  try {
    const output = run('npx prisma migrate deploy');
    if (output.includes('No pending migrations to apply')) {
      console.log('All migrations already applied.');
    } else {
      console.log(output);
    }
    return true;
  } catch (err) {
    const migrationName = getFailedMigration(err.stderr || '', err.stdout || '');
    if (!migrationName) {
      console.error('Migration failed but could not identify the failed migration.');
      console.error(err.stderr || err.stdout);
      return false;
    }
    console.log(`Failed migration detected: ${migrationName}`);
    if (retry) {
      // Second failure — force-apply as last resort
      console.log(`Attempting direct SQL execution for ${migrationName}...`);
      try {
        executeMigrationSql(migrationName);
      } catch (sqlErr) {
        console.error(`Direct SQL execution failed: ${sqlErr.stderr || sqlErr.message}`);
        console.error('Migration resolution unsuccessful. Please run manually.');
        return false;
      }
      console.log(`Marking ${migrationName} as applied...`);
      run(`npx prisma migrate resolve --applied ${migrationName}`);
      console.log('Resolved. Retrying migration deploy...');
      return deployFailed(false);
    }
    // First failure — rollback and retry
    console.log(`Rolling back ${migrationName} and retrying...`);
    run(`npx prisma migrate resolve --rolled-back ${migrationName}`);
    console.log('Rolled back. Retrying migration deploy...');
    return deployFailed(true);
  }
}

const ok = deployFailed(false);
if (!ok) process.exit(1);
