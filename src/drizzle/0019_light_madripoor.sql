ALTER TABLE "voting_phase_candidate" DROP CONSTRAINT "voting_phase_candidate_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "voting_phase_candidate" ADD CONSTRAINT "voting_phase_candidate_user_id_candidate_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."candidate"("user_id") ON DELETE no action ON UPDATE no action;