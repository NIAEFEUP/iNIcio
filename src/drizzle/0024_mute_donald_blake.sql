CREATE TABLE "final_message_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"decision" text,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL
);
