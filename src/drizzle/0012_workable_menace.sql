CREATE TABLE "candidate_vote" (
	"voting_phase_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"decision" text DEFAULT 'approve' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voting_phase" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruitment_year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voting_phase_status" (
	"voting_phase_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"accepted_candidates" integer DEFAULT 0 NOT NULL,
	"rejected_candidates" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DROP TABLE "classification" CASCADE;--> statement-breakpoint
DROP TABLE "classification_value" CASCADE;--> statement-breakpoint
DROP TABLE "candidate_to_classification" CASCADE;--> statement-breakpoint
ALTER TABLE "candidate_vote" ADD CONSTRAINT "candidate_vote_voting_phase_id_voting_phase_id_fk" FOREIGN KEY ("voting_phase_id") REFERENCES "public"."voting_phase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_vote" ADD CONSTRAINT "candidate_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_phase" ADD CONSTRAINT "voting_phase_recruitment_year_recruitment_year_fk" FOREIGN KEY ("recruitment_year") REFERENCES "public"."recruitment"("year") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_phase_status" ADD CONSTRAINT "voting_phase_status_voting_phase_id_voting_phase_id_fk" FOREIGN KEY ("voting_phase_id") REFERENCES "public"."voting_phase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_phase_status" ADD CONSTRAINT "voting_phase_status_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;