ALTER TABLE "candidate_vote" RENAME COLUMN "user_id" TO "candidate_id";--> statement-breakpoint
ALTER TABLE "recruiter_vote" RENAME COLUMN "user_id" TO "recruiter_id";--> statement-breakpoint
ALTER TABLE "candidate_vote" DROP CONSTRAINT "candidate_vote_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "recruiter_vote" DROP CONSTRAINT "recruiter_vote_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "recruiter_vote" ADD COLUMN "candidate_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "candidate_vote" ADD CONSTRAINT "candidate_vote_candidate_id_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_vote" ADD CONSTRAINT "recruiter_vote_recruiter_id_user_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_vote" ADD CONSTRAINT "recruiter_vote_candidate_id_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;