console.error('Automatic migration recovery is disabled. Run `npm run migrate:status`, restore a backup, and have an operator review the failed migration before manually using Prisma recovery commands.');
process.exit(1);
