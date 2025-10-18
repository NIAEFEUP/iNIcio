CREATE TABLE "recruiter_vote" (
	"voting_phase_id" integer NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recruiter_vote" ADD CONSTRAINT "recruiter_vote_voting_phase_id_voting_phase_id_fk" FOREIGN KEY ("voting_phase_id") REFERENCES "public"."voting_phase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_vote" ADD CONSTRAINT "recruiter_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;