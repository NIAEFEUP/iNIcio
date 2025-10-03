CREATE TABLE "dynamic_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL
);
