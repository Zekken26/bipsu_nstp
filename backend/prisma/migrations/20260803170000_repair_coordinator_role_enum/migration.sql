-- Repair deployments where the historical coordinator migration is marked as
-- applied but the PostgreSQL enum was not updated.  `IF NOT EXISTS` makes this
-- safe for databases where the enum value is already present.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COORDINATOR';
