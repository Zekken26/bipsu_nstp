# PostgreSQL foreign-key migration and recovery procedure

`20260802130000_restore_postgres_foreign_keys` restores PostgreSQL enforcement
for every Prisma-declared relation: profiles, sections, modules and their content,
submissions, enrollments, grades, coordinators, follows, and payments.

Before production deployment, create and verify a PostgreSQL backup, restore it to
a non-production database, and run `npm run report:orphans` against that copy.
The report prints up to 100 identifiers per invalid relation and exits non-zero.
It never changes data. Reconcile each finding with the data owner: restore the
missing parent, correct the child reference, or approve a separately reviewed
cleanup migration. Do not delete orphaned production rows as part of deployment.

After a clean report, run `npm run migrate:deploy` once. It runs the report first
and stops on either report or migration failure.

## Referential actions

- User-to-profile and user-to-follow rows cascade, because those rows cannot have
  meaning without the deleted user.
- Module-to-lesson/quiz/assignment and student-profile-to-submission/enrollment/
  grade rows cascade, because they are dependent coursework records.
- Optional content references in submissions and grades, optional component/
  instructor assignments, and optional section assignment use `SET NULL` to keep
  the historical row when its optional catalog parent is removed.
- Component-to-section/enrollment and user/enrollment-to-payment use `RESTRICT`:
  institutional structure and financial records require an operator decision.
- All relations use `ON UPDATE CASCADE` to preserve integrity if a key is changed.

## Failed migration recovery

Normal builds and startup never run recovery. A failed `migrate:deploy` remains
failed. First run `npm run migrate:status`, preserve logs, and restore a backup to
an isolated database. An authorized DBA reviews the partial schema/data state and
the migration SQL. Only after that review may the DBA choose the appropriate
Prisma `migrate resolve --rolled-back` or `--applied` command manually; neither is
wrapped by this project. Re-run the orphan report and migration status afterward.

## Administrator operations

`npm run admin:create` creates the configured administrator only if absent.
`npm run admin:reset-password` is deliberately separate and requires all of:
`ADMIN_EMAIL`, `ADMIN_RESET_PASSWORD`, and
`ADMIN_RESET_CONFIRM=RESET_ADMIN_PASSWORD`. Password values are never logged.
