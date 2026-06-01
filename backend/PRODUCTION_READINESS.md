# NSTP Production Readiness Notes

## Deployment Gates

- Set `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGIN` before boot.
- `JWT_SECRET` must be at least 32 characters.
- `REQUEST_TIMEOUT_MS` must stay lower than `SERVERLESS_FUNCTION_TIMEOUT_MS`.
- Use `npm run prisma:generate` during build and run migrations before releasing traffic.

## Migration Safety

1. Back up the production database before each migration.
2. Run `npx prisma migrate status` against production to verify pending migrations.
3. Apply migrations with `npx prisma migrate deploy`, not `migrate dev`.
4. Smoke-test `/health` and a read-only admin API route before enabling writes.
5. Keep rollback SQL or a database snapshot for the previous release.

## Upload Storage Strategy

- Keep API uploads as metadata/intents only.
- Store file bytes in object storage such as S3, Cloudflare R2, Supabase Storage, or Google Cloud Storage.
- Use short-lived signed upload URLs generated after `POST /api/uploads` passes validation.
- Persist storage key, checksum, MIME type, file size, uploader, assessment id, and virus-scan status in the database.
- Keep Google Drive and YouTube submissions as link records, not binary uploads.

## Backups And Restore

- Schedule automated daily database backups and retain at least 7 daily, 4 weekly, and 3 monthly snapshots.
- Test restore into a staging database monthly.
- Store object-storage lifecycle versions for uploaded evidence files.
- Keep audit logs exportable and immutable once a formal production audit store is introduced.

## Queues

The current queue is process-local and safe for single-instance staging. For production, replace it with Redis/BullMQ, SQS, Cloud Tasks, or the hosting provider's background job system so jobs survive deploys and multi-instance scaling.

## Critical Smoke Test

Run:

```bash
npm run backend:test:production-audit
npm run frontend:typecheck
npm run frontend:build
```
