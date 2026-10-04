CREATE INDEX "candidate_to_dynamic_dynamic_id_idx" ON "candidate_to_dynamic" USING btree ("dynamic_id");--> statement-breakpoint
CREATE INDEX "recruiter_to_dynamic_dynamic_id_idx" ON "recruiter_to_dynamic" USING btree ("dynamic_id");--> statement-breakpoint
CREATE INDEX "recruiter_to_interview_interview_id_idx" ON "recruiter_to_interview" USING btree ("interview_id");--> statement-breakpoint
CREATE INDEX "users_to_recruitments_recruitment_id_idx" ON "users_to_recruitments" USING btree ("recruitment_id");--> statement-breakpoint
CREATE INDEX "recruiter_avail_recruitment_id_idx" ON "recruiter_availability" USING btree ("recruitment_id");--> statement-breakpoint
CREATE INDEX "slot_recruitment_id_idx" ON "slot" USING btree ("recruitment_id");