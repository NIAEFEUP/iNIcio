-- Bridge from the pre-scoping schema (0000_baseline) to the multi-year
-- recruitment schema, including `recruitment.active` text -> boolean.
-- Runs once against the existing production database, and also as the second
-- step when building a fresh database from scratch.

--> statement-breakpoint
ALTER TABLE "recruitment" ADD COLUMN "id" serial;
--> statement-breakpoint
ALTER TABLE "recruitment" ADD COLUMN "lective_year" text;
--> statement-breakpoint
ALTER TABLE "recruitment" ADD COLUMN "semester" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "recruitment" ADD COLUMN "title" text DEFAULT 'Recrutamento 1º Semestre' NOT NULL;
--> statement-breakpoint
UPDATE "recruitment"
SET "lective_year" = "year"::text || '/' || ("year" + 1)::text
WHERE "lective_year" IS NULL;
--> statement-breakpoint
ALTER TABLE "recruiter_availability" DROP CONSTRAINT "recruiter_availability_recruitment_year_recruitment_year_fk";
--> statement-breakpoint
ALTER TABLE "recruitment_phase" DROP CONSTRAINT "recruitment_phase_recruitment_year_recruitment_year_fk";
--> statement-breakpoint
ALTER TABLE "slot" DROP CONSTRAINT "slot_recruitment_year_recruitment_year_fk";
--> statement-breakpoint
ALTER TABLE "users_to_recruitments" DROP CONSTRAINT "users_to_recruitments_recruitment_year_recruitment_year_fk";
--> statement-breakpoint
ALTER TABLE "voting_phase" DROP CONSTRAINT "voting_phase_recruitment_year_recruitment_year_fk";
--> statement-breakpoint
ALTER TABLE "recruitment" DROP CONSTRAINT "recruitment_pkey";
--> statement-breakpoint
ALTER TABLE "recruitment" ADD CONSTRAINT "recruitment_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "recruitment" ALTER COLUMN "lective_year" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "recruitment" ADD CONSTRAINT "recruitment_lective_year_semester_unique" UNIQUE ("lective_year","semester");
--> statement-breakpoint
ALTER TABLE "recruitment" ALTER COLUMN "active" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "recruitment" ALTER COLUMN "active" TYPE boolean USING ("active" = 'true');
--> statement-breakpoint
ALTER TABLE "recruitment" ALTER COLUMN "active" SET DEFAULT true;
--> statement-breakpoint

ALTER TABLE "application" ADD COLUMN "recruitment_id" integer;
--> statement-breakpoint
ALTER TABLE "candidate" ADD COLUMN "recruitment_id" integer;
--> statement-breakpoint
ALTER TABLE "candidate_to_dynamic" ADD COLUMN "recruitment_id" integer;
--> statement-breakpoint
ALTER TABLE "dynamic" ADD COLUMN "recruitment_id" integer;
--> statement-breakpoint
ALTER TABLE "interview" ADD COLUMN "recruitment_id" integer;
--> statement-breakpoint
ALTER TABLE "recruiter_availability" ADD COLUMN "recruitment_id" integer;
--> statement-breakpoint
ALTER TABLE "recruiter_to_candidate" ADD COLUMN "recruitment_id" integer;
--> statement-breakpoint
ALTER TABLE "slot" ADD COLUMN "recruitment_id" integer;
--> statement-breakpoint
ALTER TABLE "recruitment_phase" ADD COLUMN "recruitment_id" integer;
--> statement-breakpoint
ALTER TABLE "users_to_recruitments" ADD COLUMN "recruitment_id" integer;
--> statement-breakpoint
ALTER TABLE "voting_phase" ADD COLUMN "recruitment_id" integer;
--> statement-breakpoint
ALTER TABLE "voting_phase_candidate" ADD COLUMN "recruitment_id" integer;
--> statement-breakpoint

UPDATE "slot" AS t SET "recruitment_id" = r."id" FROM "recruitment" AS r WHERE t."recruitment_year" = r."year";
--> statement-breakpoint
UPDATE "recruiter_availability" AS t SET "recruitment_id" = r."id" FROM "recruitment" AS r WHERE t."recruitment_year" = r."year";
--> statement-breakpoint
UPDATE "recruitment_phase" AS t SET "recruitment_id" = r."id" FROM "recruitment" AS r WHERE t."recruitment_year" = r."year";
--> statement-breakpoint
UPDATE "voting_phase" AS t SET "recruitment_id" = r."id" FROM "recruitment" AS r WHERE t."recruitment_year" = r."year";
--> statement-breakpoint
UPDATE "users_to_recruitments" AS t SET "recruitment_id" = r."id" FROM "recruitment" AS r WHERE t."recruitment_year" = r."year";
--> statement-breakpoint
UPDATE "interview" AS t SET "recruitment_id" = s."recruitment_id" FROM "slot" AS s WHERE t."slot" = s."id";
--> statement-breakpoint
UPDATE "dynamic" AS t SET "recruitment_id" = s."recruitment_id" FROM "slot" AS s WHERE t."slot_id" = s."id";
--> statement-breakpoint
UPDATE "candidate_to_dynamic" AS t SET "recruitment_id" = d."recruitment_id" FROM "dynamic" AS d WHERE t."dynamic_id" = d."id";
--> statement-breakpoint
UPDATE "candidate" AS c
SET "recruitment_id" = COALESCE(
  (
    SELECT u."recruitment_id"
    FROM "users_to_recruitments" AS u
    WHERE u."user_id" = c."user_id"
    ORDER BY u."recruitment_id" DESC
    LIMIT 1
  ),
  (SELECT r."id" FROM "recruitment" AS r ORDER BY r."start" DESC, r."id" DESC LIMIT 1)
)
WHERE c."recruitment_id" IS NULL;
--> statement-breakpoint
UPDATE "application" AS a SET "recruitment_id" = c."recruitment_id" FROM "candidate" AS c WHERE a."candidate_id" = c."user_id";
--> statement-breakpoint
UPDATE "recruiter_to_candidate" AS rc SET "recruitment_id" = c."recruitment_id" FROM "candidate" AS c WHERE rc."candidate_id" = c."user_id";
--> statement-breakpoint
UPDATE "voting_phase_candidate" AS vc SET "recruitment_id" = v."recruitment_id" FROM "voting_phase" AS v WHERE vc."voting_phase_id" = v."id";
--> statement-breakpoint

ALTER TABLE "candidate_to_dynamic" DROP CONSTRAINT "candidate_to_dynamic_candidate_id_candidate_user_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_to_dynamic" DROP CONSTRAINT "candidate_to_dynamic_dynamic_id_dynamic_id_fk";
--> statement-breakpoint
ALTER TABLE "interview" DROP CONSTRAINT "interview_candidate_id_candidate_user_id_fk";
--> statement-breakpoint
ALTER TABLE "interview" DROP CONSTRAINT "interview_slot_slot_id_fk";
--> statement-breakpoint
ALTER TABLE "recruiter_to_candidate" DROP CONSTRAINT "recruiter_to_candidate_candidate_id_candidate_user_id_fk";
--> statement-breakpoint
ALTER TABLE "recruiter_to_candidate" DROP CONSTRAINT "recruiter_to_candidate_recruiter_id_recruiter_user_id_fk";
--> statement-breakpoint
ALTER TABLE "voting_phase_candidate" DROP CONSTRAINT "voting_phase_candidate_candidate_id_candidate_user_id_fk";
--> statement-breakpoint
ALTER TABLE "voting_phase_candidate" DROP CONSTRAINT "voting_phase_candidate_voting_phase_id_voting_phase_id_fk";
--> statement-breakpoint

ALTER TABLE "application" ALTER COLUMN "recruitment_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "candidate" ALTER COLUMN "recruitment_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "candidate_to_dynamic" ALTER COLUMN "recruitment_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "dynamic" ALTER COLUMN "recruitment_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "interview" ALTER COLUMN "recruitment_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "recruiter_availability" ALTER COLUMN "recruitment_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "recruiter_to_candidate" ALTER COLUMN "recruitment_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "slot" ALTER COLUMN "recruitment_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "recruitment_phase" ALTER COLUMN "recruitment_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "users_to_recruitments" ALTER COLUMN "recruitment_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "voting_phase" ALTER COLUMN "recruitment_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "voting_phase_candidate" ALTER COLUMN "recruitment_id" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "candidate" DROP CONSTRAINT "candidate_pkey";
--> statement-breakpoint
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_user_id_recruitment_id_pk" PRIMARY KEY ("user_id","recruitment_id");
--> statement-breakpoint
ALTER TABLE "users_to_recruitments" DROP CONSTRAINT "users_to_recruitments_user_id_recruitment_year_pk";
--> statement-breakpoint
ALTER TABLE "users_to_recruitments" DROP COLUMN "recruitment_year";
--> statement-breakpoint
ALTER TABLE "users_to_recruitments" ADD CONSTRAINT "users_to_recruitments_user_id_recruitment_id_pk" PRIMARY KEY ("user_id","recruitment_id");
--> statement-breakpoint
ALTER TABLE "recruitment" DROP COLUMN "year";
--> statement-breakpoint
ALTER TABLE "recruitment_phase" DROP COLUMN "recruitment_year";
--> statement-breakpoint
ALTER TABLE "slot" DROP COLUMN "recruitment_year";
--> statement-breakpoint
ALTER TABLE "recruiter_availability" DROP COLUMN "recruitment_year";
--> statement-breakpoint
ALTER TABLE "voting_phase" DROP COLUMN "recruitment_year";
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'recruitment_phase_slot_id_seq') THEN
    ALTER SEQUENCE "recruitment_phase_slot_id_seq" RENAME TO "slot_id_seq";
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_phase_slot_pkey') THEN
    ALTER TABLE "slot" RENAME CONSTRAINT "recruitment_phase_slot_pkey" TO "slot_pkey";
  END IF;
END $$;
--> statement-breakpoint

ALTER TABLE "slot" ADD CONSTRAINT "slot_id_recruitment_unique" UNIQUE ("id","recruitment_id");
--> statement-breakpoint
ALTER TABLE "dynamic" ADD CONSTRAINT "dynamic_id_recruitment_unique" UNIQUE ("id","recruitment_id");
--> statement-breakpoint
ALTER TABLE "voting_phase" ADD CONSTRAINT "voting_phase_id_recruitment_unique" UNIQUE ("id","recruitment_id");
--> statement-breakpoint

ALTER TABLE "application" DROP CONSTRAINT "application_candidate_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_candidate_id_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_recruitment_id_recruitment_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_candidate_recruitment_unique" UNIQUE ("candidate_id","recruitment_id");
--> statement-breakpoint
ALTER TABLE "candidate" DROP CONSTRAINT "candidate_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_recruitment_id_recruitment_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "candidate_to_dynamic" ADD CONSTRAINT "candidate_dynamic_recruitment_unique" UNIQUE ("candidate_id","recruitment_id");
--> statement-breakpoint
ALTER TABLE "candidate_to_dynamic" ADD CONSTRAINT "candidate_to_dynamic_candidate_fk" FOREIGN KEY ("candidate_id","recruitment_id") REFERENCES "candidate"("user_id","recruitment_id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "candidate_to_dynamic" ADD CONSTRAINT "candidate_to_dynamic_dynamic_fk" FOREIGN KEY ("dynamic_id","recruitment_id") REFERENCES "dynamic"("id","recruitment_id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "candidate_to_dynamic" ADD CONSTRAINT "candidate_to_dynamic_dynamic_id_dynamic_id_fk" FOREIGN KEY ("dynamic_id") REFERENCES "dynamic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "candidate_to_dynamic" ADD CONSTRAINT "candidate_to_dynamic_recruitment_id_recruitment_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "candidate_to_dynamic" ADD CONSTRAINT "candidate_to_dynamic_candidate_id_dynamic_id_pk" PRIMARY KEY ("candidate_id","dynamic_id");
--> statement-breakpoint
ALTER TABLE "candidate_vote" DROP CONSTRAINT "candidate_vote_candidate_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_vote" ADD CONSTRAINT "candidate_vote_candidate_id_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "candidate_vote" DROP CONSTRAINT "candidate_vote_voting_phase_id_voting_phase_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_vote" ADD CONSTRAINT "candidate_vote_voting_phase_id_voting_phase_id_fk" FOREIGN KEY ("voting_phase_id") REFERENCES "voting_phase"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "dynamic" ADD CONSTRAINT "dynamic_recruitment_id_recruitment_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "interview" ADD CONSTRAINT "interview_candidate_fk" FOREIGN KEY ("candidate_id","recruitment_id") REFERENCES "candidate"("user_id","recruitment_id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "interview" ADD CONSTRAINT "interview_recruitment_id_recruitment_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "interview" ADD CONSTRAINT "interview_slot_fk" FOREIGN KEY ("slot","recruitment_id") REFERENCES "slot"("id","recruitment_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "interview" ADD CONSTRAINT "interview_candidate_recruitment_unique" UNIQUE ("candidate_id","recruitment_id");
--> statement-breakpoint
ALTER TABLE "recruiter_availability" DROP CONSTRAINT "recruiter_availability_recruiter_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "recruiter_availability" ADD CONSTRAINT "recruiter_availability_recruiter_id_user_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "recruiter_availability" ADD CONSTRAINT "recruiter_availability_recruitment_id_recruitment_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "recruiter_to_candidate" ADD CONSTRAINT "recruiter_to_candidate_candidate_fk" FOREIGN KEY ("candidate_id","recruitment_id") REFERENCES "candidate"("user_id","recruitment_id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "recruiter_to_candidate" ADD CONSTRAINT "recruiter_to_candidate_recruiter_id_recruiter_user_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "recruiter"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "recruiter_to_candidate" ADD CONSTRAINT "recruiter_to_candidate_recruitment_id_recruitment_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "recruiter_to_candidate" ADD CONSTRAINT "recruiter_to_candidate_recruiter_id_candidate_id_recruitment_id" PRIMARY KEY ("recruiter_id","candidate_id","recruitment_id");
--> statement-breakpoint
ALTER TABLE "recruiter_to_dynamic" ADD CONSTRAINT "recruiter_to_dynamic_recruiter_id_dynamic_id_pk" PRIMARY KEY ("recruiter_id","dynamic_id");
--> statement-breakpoint
ALTER TABLE "recruiter_to_interview" ADD CONSTRAINT "recruiter_to_interview_recruiter_id_interview_id_pk" PRIMARY KEY ("recruiter_id","interview_id");
--> statement-breakpoint
ALTER TABLE "recruiter_vote" DROP CONSTRAINT "recruiter_vote_candidate_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "recruiter_vote" ADD CONSTRAINT "recruiter_vote_candidate_id_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "recruiter_vote" DROP CONSTRAINT "recruiter_vote_recruiter_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "recruiter_vote" ADD CONSTRAINT "recruiter_vote_recruiter_id_user_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "recruiter_vote" DROP CONSTRAINT "recruiter_vote_voting_phase_id_voting_phase_id_fk";
--> statement-breakpoint
ALTER TABLE "recruiter_vote" ADD CONSTRAINT "recruiter_vote_voting_phase_id_voting_phase_id_fk" FOREIGN KEY ("voting_phase_id") REFERENCES "voting_phase"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "recruitment_phase" ADD CONSTRAINT "recruitment_phase_recruitment_id_recruitment_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "slot" ADD CONSTRAINT "slot_recruitment_id_recruitment_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "users_to_recruitments" DROP CONSTRAINT "users_to_recruitments_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "users_to_recruitments" ADD CONSTRAINT "users_to_recruitments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "users_to_recruitments" ADD CONSTRAINT "users_to_recruitments_recruitment_id_recruitment_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "voting_phase" ADD CONSTRAINT "voting_phase_recruitment_id_recruitment_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "voting_phase_candidate" ADD CONSTRAINT "voting_phase_candidate_candidate_fk" FOREIGN KEY ("candidate_id","recruitment_id") REFERENCES "candidate"("user_id","recruitment_id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "voting_phase_candidate" ADD CONSTRAINT "voting_phase_candidate_phase_fk" FOREIGN KEY ("voting_phase_id","recruitment_id") REFERENCES "voting_phase"("id","recruitment_id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "voting_phase_candidate" ADD CONSTRAINT "voting_phase_candidate_recruitment_id_recruitment_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "recruitment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "voting_phase_candidate" ADD CONSTRAINT "voting_phase_candidate_voting_phase_id_candidate_id_pk" PRIMARY KEY ("voting_phase_id","candidate_id");
--> statement-breakpoint
ALTER TABLE "voting_phase_status" DROP CONSTRAINT "voting_phase_status_voting_phase_id_voting_phase_id_fk";
--> statement-breakpoint
ALTER TABLE "voting_phase_status" ADD CONSTRAINT "voting_phase_status_voting_phase_id_voting_phase_id_fk" FOREIGN KEY ("voting_phase_id") REFERENCES "voting_phase"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "application_interests" ADD CONSTRAINT "application_interests_application_id_interest_pk" PRIMARY KEY ("application_id","interest");
--> statement-breakpoint
ALTER TABLE "application_interests" ADD CONSTRAINT "application_interests_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "application"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "application_to_tag" ADD CONSTRAINT "application_to_tag_application_id_tag_id_pk" PRIMARY KEY ("application_id","tag_id");
--> statement-breakpoint

CREATE INDEX "recruitment_lective_year_idx" ON "recruitment" ("lective_year");
--> statement-breakpoint
CREATE INDEX "application_recruitment_id_idx" ON "application" ("recruitment_id");
--> statement-breakpoint
CREATE INDEX "dynamic_recruitment_id_idx" ON "dynamic" ("recruitment_id");
--> statement-breakpoint
CREATE INDEX "dynamic_slot_idx" ON "dynamic" ("slot_id");
--> statement-breakpoint
CREATE INDEX "interview_recruitment_id_idx" ON "interview" ("recruitment_id");
--> statement-breakpoint
CREATE INDEX "interview_slot_idx" ON "interview" ("slot");
--> statement-breakpoint

INSERT INTO "users_to_recruitments" ("user_id", "recruitment_id")
SELECT DISTINCT r."user_id", rec."id"
FROM "recruiter" AS r
CROSS JOIN (
  SELECT "id" FROM "recruitment" ORDER BY "start" DESC, "id" DESC LIMIT 1
) AS rec
ON CONFLICT DO NOTHING;
--> statement-breakpoint
