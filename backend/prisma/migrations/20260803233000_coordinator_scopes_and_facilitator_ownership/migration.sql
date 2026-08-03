CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "CoordinatorScope" AS ENUM ('CWTS', 'MTS', 'LTS');

ALTER TABLE "user"
ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

INSERT INTO "nstp_component" ("id", "type", "name", "createdAt", "updatedAt") VALUES
  ('system-component-cwts', 'CWTS', 'CWTS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('system-component-lts', 'LTS', 'LTS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('system-component-mts-army', 'MTS_ARMY', 'MTS (Army)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('system-component-mts-navy', 'MTS_NAVY', 'MTS (Navy)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('system-component-cwts-coast-guard', 'CWTS_COAST_GUARD', 'CWTS (Coast Guard)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("type") DO UPDATE SET
  "name" = EXCLUDED."name",
  "updatedAt" = CURRENT_TIMESTAMP;

ALTER TABLE "coordinator_profile"
ADD COLUMN "scope" "CoordinatorScope" NOT NULL DEFAULT 'CWTS';

UPDATE "coordinator_profile" AS coordinator
SET "scope" = CASE
  WHEN component."type" IN ('MTS_ARMY', 'MTS_NAVY') THEN 'MTS'::"CoordinatorScope"
  WHEN component."type" = 'LTS' THEN 'LTS'::"CoordinatorScope"
  ELSE 'CWTS'::"CoordinatorScope"
END
FROM "nstp_component" AS component
WHERE coordinator."componentId" = component."id";

ALTER TABLE "instructor_profile"
ADD COLUMN "coordinatorId" TEXT,
ADD COLUMN "componentId" TEXT,
ADD COLUMN "municipalities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "instructor_profile" AS instructor
SET "municipalities" = COALESCE(
  ARRAY(
    SELECT jsonb_array_elements_text(
      CASE
        WHEN jsonb_typeof(account."data"::jsonb -> 'municipalities') = 'array'
          THEN account."data"::jsonb -> 'municipalities'
        ELSE '[]'::jsonb
      END
    )
  ),
  ARRAY[]::TEXT[]
)
FROM "user" AS account
WHERE instructor."userId" = account."id";

UPDATE "instructor_profile" AS instructor
SET "componentId" = component."id"
FROM "user" AS account, "nstp_component" AS component
WHERE instructor."userId" = account."id"
  AND component."type" = CASE account."data"::jsonb ->> 'component'
    WHEN 'LTS' THEN 'LTS'::"NSTPComponentType"
    WHEN 'MTS (Army)' THEN 'MTS_ARMY'::"NSTPComponentType"
    WHEN 'MTS (Navy)' THEN 'MTS_NAVY'::"NSTPComponentType"
    WHEN 'CWTS (Coast Guard)' THEN 'CWTS_COAST_GUARD'::"NSTPComponentType"
    ELSE 'CWTS'::"NSTPComponentType"
  END;

-- Preserve existing facilitator visibility only when ownership is unambiguous.
-- If a program has multiple coordinators, the facilitator remains unassigned
-- for an administrator to resolve rather than being assigned arbitrarily.
UPDATE "instructor_profile" AS instructor
SET "coordinatorId" = coordinator."id"
FROM "nstp_component" AS component, "coordinator_profile" AS coordinator
WHERE instructor."componentId" = component."id"
  AND coordinator."scope" = CASE
    WHEN component."type" IN ('MTS_ARMY', 'MTS_NAVY') THEN 'MTS'::"CoordinatorScope"
    WHEN component."type" = 'LTS' THEN 'LTS'::"CoordinatorScope"
    ELSE 'CWTS'::"CoordinatorScope"
  END
  AND 1 = (
    SELECT COUNT(*)
    FROM "coordinator_profile" AS candidate
    WHERE candidate."scope" = coordinator."scope"
  );

CREATE INDEX "instructor_profile_coordinatorId_idx" ON "instructor_profile"("coordinatorId");
CREATE INDEX "instructor_profile_componentId_idx" ON "instructor_profile"("componentId");

ALTER TABLE "instructor_profile"
ADD CONSTRAINT "instructor_profile_coordinatorId_fkey"
FOREIGN KEY ("coordinatorId") REFERENCES "coordinator_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "instructor_profile"
ADD CONSTRAINT "instructor_profile_componentId_fkey"
FOREIGN KEY ("componentId") REFERENCES "nstp_component"("id") ON DELETE SET NULL ON UPDATE CASCADE;
