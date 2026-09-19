ALTER TABLE "slot" ALTER COLUMN "type" SET DEFAULT 'interview';
--> statement-breakpoint
UPDATE "slot" SET "type" = 'interview' WHERE "type" = 'interview-dynamic';