CREATE TABLE "recruiter_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"start" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"recruiter_id" text NOT NULL,
	"recruitment_year" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recruiter_availability" ADD CONSTRAINT "recruiter_availability_recruiter_id_user_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_availability" ADD CONSTRAINT "recruiter_availability_recruitment_year_recruitment_year_fk" FOREIGN KEY ("recruitment_year") REFERENCES "public"."recruitment"("year") ON DELETE no action ON UPDATE no action;