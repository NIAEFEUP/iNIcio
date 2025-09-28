ALTER TABLE "application_comment" ALTER COLUMN "content" SET DATA TYPE jsonb USING content::jsonb;
