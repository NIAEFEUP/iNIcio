ALTER TABLE "dynamic_comment" ALTER COLUMN "content" SET DATA TYPE jsonb USING "content"::jsonb;
ALTER TABLE "interview_comment" ALTER COLUMN "content" SET DATA TYPE jsonb USING "content"::jsonb;
