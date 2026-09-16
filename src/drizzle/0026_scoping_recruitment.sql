-- 1. Add columns to recruitment
ALTER TABLE "recruitment" ADD COLUMN IF NOT EXISTS "id" serial;
ALTER TABLE "recruitment" ADD COLUMN IF NOT EXISTS "lective_year" text;
ALTER TABLE "recruitment" ADD COLUMN IF NOT EXISTS "semester" integer DEFAULT 1 NOT NULL;
ALTER TABLE "recruitment" ADD COLUMN IF NOT EXISTS "title" text DEFAULT 'Recrutamento 1º Semestre' NOT NULL;

-- 2. Build a mapping from every existing recruitment row's old year to its new
--    id, then backfill the new recruitment columns for all of them.
CREATE TEMP TABLE "recruitment_year_map" AS
SELECT "year" AS "old_year", "id" AS "new_id"
FROM "recruitment";

UPDATE "recruitment"
SET "lective_year" = "year"::text || '/' || ("year" + 1)::text,
    "semester" = 1,
    "title" = 'Recrutamento 1º Semestre'
WHERE "lective_year" IS NULL;

-- 3. Set recruitment primary key to id
ALTER TABLE "recruitment" DROP CONSTRAINT IF EXISTS "recruitment_pkey" CASCADE;
ALTER TABLE "recruitment" ADD PRIMARY KEY ("id");
ALTER TABLE "recruitment" ALTER COLUMN "lective_year" SET NOT NULL;
ALTER TABLE "recruitment" ADD CONSTRAINT "recruitment_lective_year_semester_unique" 
    UNIQUE ("lective_year", "semester");

-- 4. Add recruitment_id to all child tables
ALTER TABLE "application" ADD COLUMN IF NOT EXISTS "recruitment_id" integer;
ALTER TABLE "interview" ADD COLUMN IF NOT EXISTS "recruitment_id" integer;
ALTER TABLE "dynamic" ADD COLUMN IF NOT EXISTS "recruitment_id" integer;
ALTER TABLE "candidate_to_dynamic" ADD COLUMN IF NOT EXISTS "recruitment_id" integer;
ALTER TABLE "candidate" ADD COLUMN IF NOT EXISTS "recruitment_id" integer;
ALTER TABLE "recruiter_to_candidate" ADD COLUMN IF NOT EXISTS "recruitment_id" integer;
ALTER TABLE "slot" ADD COLUMN IF NOT EXISTS "recruitment_id" integer;
ALTER TABLE "recruiter_availability" ADD COLUMN IF NOT EXISTS "recruitment_id" integer;
ALTER TABLE "recruitment_phase" ADD COLUMN IF NOT EXISTS "recruitment_id" integer;
ALTER TABLE "voting_phase" ADD COLUMN IF NOT EXISTS "recruitment_id" integer;
ALTER TABLE "users_to_recruitments" ADD COLUMN IF NOT EXISTS "recruitment_id" integer;

-- 5. Backfill each child table from the year -> id mapping so every row keeps
--    the recruitment it originally belonged to.
-- Tables that stored the recruitment year:
UPDATE "slot" AS t SET "recruitment_id" = m."new_id"
FROM "recruitment_year_map" AS m
WHERE t."recruitment_year" = m."old_year" AND t."recruitment_id" IS NULL;

UPDATE "recruiter_availability" AS t SET "recruitment_id" = m."new_id"
FROM "recruitment_year_map" AS m
WHERE t."recruitment_year" = m."old_year" AND t."recruitment_id" IS NULL;

UPDATE "recruitment_phase" AS t SET "recruitment_id" = m."new_id"
FROM "recruitment_year_map" AS m
WHERE t."recruitment_year" = m."old_year" AND t."recruitment_id" IS NULL;

UPDATE "voting_phase" AS t SET "recruitment_id" = m."new_id"
FROM "recruitment_year_map" AS m
WHERE t."recruitment_year" = m."old_year" AND t."recruitment_id" IS NULL;

UPDATE "users_to_recruitments" AS t SET "recruitment_id" = m."new_id"
FROM "recruitment_year_map" AS m
WHERE t."recruitment_year" = m."old_year" AND t."recruitment_id" IS NULL;

-- Tables that hang off a slot inherit the slot's recruitment:
UPDATE "interview" AS t SET "recruitment_id" = s."recruitment_id"
FROM "slot" AS s
WHERE t."slot" = s."id" AND t."recruitment_id" IS NULL;

UPDATE "dynamic" AS t SET "recruitment_id" = s."recruitment_id"
FROM "slot" AS s
WHERE t."slot_id" = s."id" AND t."recruitment_id" IS NULL;

UPDATE "candidate_to_dynamic" AS t SET "recruitment_id" = d."recruitment_id"
FROM "dynamic" AS d
WHERE t."dynamic_id" = d."id" AND t."recruitment_id" IS NULL;

-- Tables with no stored year inherit the recruitment their user is enrolled in
-- (preferring the active recruitment), keeping related rows consistent:
UPDATE "candidate" AS c
SET "recruitment_id" = COALESCE(
  (
    SELECT utr."recruitment_id"
    FROM "users_to_recruitments" AS utr
    WHERE utr."user_id" = c."user_id"
    ORDER BY
      (utr."recruitment_id" = (
        SELECT r."id" FROM "recruitment" AS r
        WHERE r."active" = 'true'
        ORDER BY r."year" DESC
        LIMIT 1
      )) DESC,
      utr."recruitment_id" DESC
    LIMIT 1
  ),
  (SELECT "id" FROM "recruitment" ORDER BY "year" DESC LIMIT 1)
)
WHERE c."recruitment_id" IS NULL;

UPDATE "application" AS a SET "recruitment_id" = c."recruitment_id"
FROM "candidate" AS c
WHERE a."candidate_id" = c."user_id" AND a."recruitment_id" IS NULL;

UPDATE "recruiter_to_candidate" AS rc SET "recruitment_id" = c."recruitment_id"
FROM "candidate" AS c
WHERE rc."candidate_id" = c."user_id" AND rc."recruitment_id" IS NULL;

-- 6. Re-key candidate table with composite PK
ALTER TABLE "candidate" DROP CONSTRAINT IF EXISTS "candidate_pkey" CASCADE;
ALTER TABLE "candidate" ALTER COLUMN "recruitment_id" SET NOT NULL;
ALTER TABLE "candidate" ADD PRIMARY KEY ("user_id", "recruitment_id");

-- 7. Add foreign keys and unique constraints
ALTER TABLE "application" ALTER COLUMN "recruitment_id" SET NOT NULL;
ALTER TABLE "application" ADD CONSTRAINT "application_recruitment_id_fk" 
    FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE;
ALTER TABLE "application" ADD CONSTRAINT "application_candidate_recruitment_unique" 
    UNIQUE ("candidate_id", "recruitment_id");

ALTER TABLE "interview" ALTER COLUMN "recruitment_id" SET NOT NULL;
ALTER TABLE "interview" ADD CONSTRAINT "interview_recruitment_id_fk" 
    FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE;
ALTER TABLE "interview" ADD CONSTRAINT "interview_candidate_recruitment_unique" 
    UNIQUE ("candidate_id", "recruitment_id");

ALTER TABLE "candidate_to_dynamic" ALTER COLUMN "recruitment_id" SET NOT NULL;
ALTER TABLE "candidate_to_dynamic" ADD CONSTRAINT "candidate_to_dynamic_recruitment_fk" 
    FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE;
ALTER TABLE "candidate_to_dynamic" ADD CONSTRAINT "candidate_dynamic_recruitment_unique" 
    UNIQUE ("candidate_id", "recruitment_id");

ALTER TABLE "slot" ALTER COLUMN "recruitment_id" SET NOT NULL;
ALTER TABLE "slot" ADD CONSTRAINT "slot_recruitment_id_fk" 
    FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE;

ALTER TABLE "recruiter_availability" ALTER COLUMN "recruitment_id" SET NOT NULL;
ALTER TABLE "recruiter_availability" ADD CONSTRAINT "recruiter_availability_recruitment_id_fk" 
    FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE;

ALTER TABLE "recruitment_phase" ALTER COLUMN "recruitment_id" SET NOT NULL;
ALTER TABLE "recruitment_phase" ADD CONSTRAINT "recruitment_phase_recruitment_id_fk" 
    FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE;

ALTER TABLE "voting_phase" ALTER COLUMN "recruitment_id" SET NOT NULL;
ALTER TABLE "voting_phase" ADD CONSTRAINT "voting_phase_recruitment_id_fk" 
    FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE;

ALTER TABLE "users_to_recruitments" DROP CONSTRAINT IF EXISTS "users_to_recruitments_pkey" CASCADE;
ALTER TABLE "users_to_recruitments" ALTER COLUMN "recruitment_id" SET NOT NULL;
ALTER TABLE "users_to_recruitments" ADD PRIMARY KEY ("user_id", "recruitment_id");
ALTER TABLE "users_to_recruitments" ADD CONSTRAINT "users_to_recruitments_recruitment_id_fk" 
    FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE;

DROP TABLE IF EXISTS "recruitment_year_map";
