ALTER TABLE "voting_phase_status" RENAME COLUMN "user_id" TO "candidate_id";--> statement-breakpoint
ALTER TABLE "voting_phase_status" DROP CONSTRAINT "voting_phase_status_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "voting_phase_status" ADD CONSTRAINT "voting_phase_status_candidate_id_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;