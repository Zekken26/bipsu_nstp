CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "quiz"
ADD COLUMN "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT';

UPDATE "quiz"
SET "status" = CASE
  WHEN LOWER(COALESCE("data"->>'status', 'draft')) = 'published' THEN 'PUBLISHED'::"AssessmentStatus"
  WHEN LOWER(COALESCE("data"->>'status', 'draft')) = 'archived' THEN 'ARCHIVED'::"AssessmentStatus"
  ELSE 'DRAFT'::"AssessmentStatus"
END;

ALTER TABLE "question"
ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Preserve legacy JSON question definitions by copying them into relational rows.
-- The original JSON remains intact for rollback/inspection and no records are deleted.
INSERT INTO "question" ("id", "quizId", "prompt", "options", "answer", "points", "order", "createdAt", "updatedAt")
SELECT
  'legacy-' || md5(q."id" || ':' || question_data.ordinality::text),
  q."id",
  COALESCE(question_data.value->>'prompt', ''),
  COALESCE(question_data.value->'options', '[]'::jsonb),
  jsonb_build_object('correctIndex', CASE WHEN COALESCE(question_data.value->>'correctIndex', '') ~ '^[0-9]+$' THEN (question_data.value->>'correctIndex')::integer ELSE 0 END),
  1,
  question_data.ordinality::integer - 1,
  NOW(),
  NOW()
FROM "quiz" q
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(q."data"->'questions') = 'array' THEN q."data"->'questions' ELSE '[]'::jsonb END
) WITH ORDINALITY AS question_data(value, ordinality)
WHERE NOT EXISTS (SELECT 1 FROM "question" existing WHERE existing."quizId" = q."id")
  AND NULLIF(BTRIM(question_data.value->>'prompt'), '') IS NOT NULL
ON CONFLICT ("id") DO NOTHING;

UPDATE "quiz" q
SET "totalPoints" = question_count.total
FROM (
  SELECT "quizId", COUNT(*)::integer AS total
  FROM "question"
  WHERE "quizId" IS NOT NULL
  GROUP BY "quizId"
) question_count
WHERE q."id" = question_count."quizId";

CREATE INDEX "quiz_moduleId_status_idx" ON "quiz"("moduleId", "status");
