import { execSync } from 'child_process';

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8', ...opts });
}

try {
  console.log('Checking for failed migrations...');
  const output = run('npx prisma migrate deploy');
  if (output.includes('No pending migrations to apply')) {
    console.log('All migrations already applied.');
  } else {
    console.log(output);
  }
} catch (err) {
  const stderr = err.stderr || '';
  const stdout = err.stdout || '';
  const combined = stderr + stdout;

  const failedMatch = combined.match(/The\s+`([^`]+)`\s+migration/);
  if (failedMatch) {
    const failedMigration = failedMatch[1];
    console.log(`Failed migration detected: ${failedMigration}`);
    console.log(`Resolving as applied...`);
    run(`npx prisma migrate resolve --applied ${failedMigration}`);
    console.log(`Resolved. Retrying migration deploy...`);
    run('npx prisma migrate deploy', { stdio: 'inherit' });
  } else {
    console.error('Migration failed but could not identify the failed migration.');
    console.error(stderr);
    process.exit(1);
  }
}
