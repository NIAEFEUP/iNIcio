ALTER TABLE "application_comment" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "dynamic_comment" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "interview_comment" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;