ALTER TABLE "application_comment" ADD COLUMN "edited_at" timestamp;--> statement-breakpoint
ALTER TABLE "dynamic_comment" ADD COLUMN "edited_at" timestamp;--> statement-breakpoint
ALTER TABLE "interview_comment" ADD COLUMN "edited_at" timestamp;