-- 1. Add columns to recruitment
ALTER TABLE "recruitment" ADD COLUMN IF NOT EXISTS "id" serial;
ALTER TABLE "recruitment" ADD COLUMN IF NOT EXISTS "lective_year" text;
ALTER TABLE "recruitment" ADD COLUMN IF NOT EXISTS "semester" integer DEFAULT 1 NOT NULL;
ALTER TABLE "recruitment" ADD COLUMN IF NOT EXISTS "title" text DEFAULT 'Recrutamento 1º Semestre' NOT NULL;

-- 2. Backfill existing 2025 recruitment to lective year "2024/2025"
UPDATE "recruitment"
SET "lective_year" = '2024/2025',
    "semester" = 1,
    "title" = 'Recrutamento 1º Semestre'
WHERE "year" = 2025 AND "lective_year" IS NULL;

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

-- 5. Backfill child tables with recruitment.id (1)
UPDATE "application" SET "recruitment_id" = 1 WHERE "recruitment_id" IS NULL;
UPDATE "interview" SET "recruitment_id" = 1 WHERE "recruitment_id" IS NULL;
UPDATE "dynamic" SET "recruitment_id" = 1 WHERE "recruitment_id" IS NULL;
UPDATE "candidate_to_dynamic" SET "recruitment_id" = 1 WHERE "recruitment_id" IS NULL;
UPDATE "candidate" SET "recruitment_id" = 1 WHERE "recruitment_id" IS NULL;
UPDATE "recruiter_to_candidate" SET "recruitment_id" = 1 WHERE "recruitment_id" IS NULL;
UPDATE "slot" SET "recruitment_id" = 1 WHERE "recruitment_id" IS NULL;
UPDATE "recruiter_availability" SET "recruitment_id" = 1 WHERE "recruitment_id" IS NULL;
UPDATE "recruitment_phase" SET "recruitment_id" = 1 WHERE "recruitment_id" IS NULL;
UPDATE "voting_phase" SET "recruitment_id" = 1 WHERE "recruitment_id" IS NULL;
UPDATE "users_to_recruitments" SET "recruitment_id" = 1 WHERE "recruitment_id" IS NULL;

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
