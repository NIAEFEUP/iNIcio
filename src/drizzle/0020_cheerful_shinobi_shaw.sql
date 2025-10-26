ALTER TABLE "voting_phase_candidate" RENAME COLUMN "user_id" TO "candidate_id";--> statement-breakpoint
ALTER TABLE "voting_phase_candidate" DROP CONSTRAINT "voting_phase_candidate_user_id_candidate_user_id_fk";
--> statement-breakpoint
ALTER TABLE "voting_phase_candidate" ADD CONSTRAINT "voting_phase_candidate_candidate_id_candidate_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate"("user_id") ON DELETE no action ON UPDATE no action;