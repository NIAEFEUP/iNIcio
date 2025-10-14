CREATE TABLE "classification" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"classification_value_id" text
);
--> statement-breakpoint
CREATE TABLE "classification_value" (
	"id" serial PRIMARY KEY NOT NULL,
	"classification_id" text NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_to_classification" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" text NOT NULL,
	"classification_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate" ADD COLUMN "interview_classification" text DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "candidate" ADD COLUMN "dynamic_classification" text DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "classification" ADD CONSTRAINT "classification_classification_value_id_classification_value_id_fk" FOREIGN KEY ("classification_value_id") REFERENCES "public"."classification_value"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_to_classification" ADD CONSTRAINT "candidate_to_classification_candidate_id_candidate_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_to_classification" ADD CONSTRAINT "candidate_to_classification_classification_id_classification_id_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."classification"("id") ON DELETE no action ON UPDATE no action;