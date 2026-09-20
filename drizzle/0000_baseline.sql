CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"issuer" text DEFAULT 'local:credential' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin" (
	"user_id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application" (
	"id" serial PRIMARY KEY NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"student_number" integer NOT NULL,
	"linkedin" text,
	"github" text,
	"personal_website" text,
	"accepted" boolean DEFAULT false NOT NULL,
	"candidate_id" text NOT NULL,
	"phone" text,
	"student_year" text,
	"degree" text,
	"curricular_year" text,
	"profile_picture" text,
	"curriculum" text,
	"experience" text,
	"motivation" text,
	"self_promotion" text,
	"suggestions" text,
	"interest_justification" text,
	"recruitment_first_interaction" text,
	"full_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" jsonb NOT NULL,
	"application_id" integer NOT NULL,
	"author_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_interests" (
	"application_id" integer NOT NULL,
	"interest" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_to_tag" (
	"application_id" integer NOT NULL,
	"tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appreciation" (
	"id" serial PRIMARY KEY NOT NULL,
	"grade" integer NOT NULL,
	"application_id" integer NOT NULL,
	"recruiter_id" text NOT NULL,
	CONSTRAINT "grade_range" CHECK ((grade >= 0) AND (grade <= 3))
);
--> statement-breakpoint
CREATE TABLE "candidate" (
	"user_id" text PRIMARY KEY NOT NULL,
	"interview_classification" text DEFAULT 'none',
	"dynamic_classification" text DEFAULT 'none'
);
--> statement-breakpoint
CREATE TABLE "candidate_to_dynamic" (
	"candidate_id" text NOT NULL,
	"dynamic_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_vote" (
	"voting_phase_id" integer NOT NULL,
	"candidate_id" text NOT NULL,
	"decision" text DEFAULT 'approve' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dynamic" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot_id" integer NOT NULL,
	"content" jsonb
);
--> statement-breakpoint
CREATE TABLE "dynamic_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" jsonb NOT NULL,
	"dynamic_id" integer NOT NULL,
	"author_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dynamic_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "final_message_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"decision" text,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" text NOT NULL,
	"slot" integer NOT NULL,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"locked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_comment" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" jsonb NOT NULL,
	"interview_id" integer NOT NULL,
	"author_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter" (
	"user_id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"start" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"recruiter_id" text NOT NULL,
	"recruitment_year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_to_candidate" (
	"recruiter_id" text NOT NULL,
	"candidate_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_to_dynamic" (
	"recruiter_id" text NOT NULL,
	"dynamic_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_to_interview" (
	"recruiter_id" text NOT NULL,
	"interview_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_vote" (
	"voting_phase_id" integer NOT NULL,
	"recruiter_id" text NOT NULL,
	"candidate_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruitment" (
	"year" integer PRIMARY KEY NOT NULL,
	"active" text DEFAULT 'true' NOT NULL,
	"start" timestamp DEFAULT now() NOT NULL,
	"end" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruitment_phase" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruitment_year" integer NOT NULL,
	"role" text NOT NULL,
	"start" timestamp,
	"end" timestamp,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"client_identifier" text DEFAULT '' NOT NULL,
	CONSTRAINT "start_before_end" CHECK (start < "end")
);
--> statement-breakpoint
CREATE TABLE "recruitment_phase_status" (
	"user_id" text NOT NULL,
	"phase_id" integer NOT NULL,
	"status" text NOT NULL,
	CONSTRAINT "recruitment_phase_status_user_id_phase_id_pk" PRIMARY KEY("user_id","phase_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "slot" (
	"id" serial PRIMARY KEY NOT NULL,
	"start" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"type" text DEFAULT 'interview-dynamic',
	"recruitment_year" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tag_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users_to_recruitments" (
	"user_id" text NOT NULL,
	"recruitment_year" integer NOT NULL,
	CONSTRAINT "users_to_recruitments_user_id_recruitment_year_pk" PRIMARY KEY("user_id","recruitment_year")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "voting_phase" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruitment_year" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "voting_phase_candidate" (
	"voting_phase_id" integer NOT NULL,
	"candidate_id" text NOT NULL,
	"vote_finished" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voting_phase_status" (
	"voting_phase_id" integer NOT NULL,
	"candidate_id" text,
	"accepted_candidates" integer DEFAULT 0 NOT NULL,
	"rejected_candidates" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_candidate_id_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_comment" ADD CONSTRAINT "application_comment_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_comment" ADD CONSTRAINT "application_comment_author_id_recruiter_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."recruiter"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_to_tag" ADD CONSTRAINT "application_to_tag_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_to_tag" ADD CONSTRAINT "application_to_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appreciation" ADD CONSTRAINT "appreciation_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appreciation" ADD CONSTRAINT "appreciation_recruiter_id_recruiter_user_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_to_dynamic" ADD CONSTRAINT "candidate_to_dynamic_candidate_id_candidate_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_to_dynamic" ADD CONSTRAINT "candidate_to_dynamic_dynamic_id_dynamic_id_fk" FOREIGN KEY ("dynamic_id") REFERENCES "public"."dynamic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_vote" ADD CONSTRAINT "candidate_vote_candidate_id_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_vote" ADD CONSTRAINT "candidate_vote_voting_phase_id_voting_phase_id_fk" FOREIGN KEY ("voting_phase_id") REFERENCES "public"."voting_phase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic" ADD CONSTRAINT "dynamic_slot_id_slot_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slot"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_comment" ADD CONSTRAINT "dynamic_comment_author_id_recruiter_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."recruiter"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_comment" ADD CONSTRAINT "dynamic_comment_dynamic_id_dynamic_id_fk" FOREIGN KEY ("dynamic_id") REFERENCES "public"."dynamic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview" ADD CONSTRAINT "interview_candidate_id_candidate_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview" ADD CONSTRAINT "interview_slot_slot_id_fk" FOREIGN KEY ("slot") REFERENCES "public"."slot"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_comment" ADD CONSTRAINT "interview_comment_author_id_recruiter_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."recruiter"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_comment" ADD CONSTRAINT "interview_comment_interview_id_interview_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interview"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter" ADD CONSTRAINT "recruiter_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_availability" ADD CONSTRAINT "recruiter_availability_recruiter_id_user_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_availability" ADD CONSTRAINT "recruiter_availability_recruitment_year_recruitment_year_fk" FOREIGN KEY ("recruitment_year") REFERENCES "public"."recruitment"("year") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_to_candidate" ADD CONSTRAINT "recruiter_to_candidate_candidate_id_candidate_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_to_candidate" ADD CONSTRAINT "recruiter_to_candidate_recruiter_id_recruiter_user_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_to_dynamic" ADD CONSTRAINT "recruiter_to_dynamic_dynamic_id_dynamic_id_fk" FOREIGN KEY ("dynamic_id") REFERENCES "public"."dynamic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_to_dynamic" ADD CONSTRAINT "recruiter_to_dynamic_recruiter_id_recruiter_user_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_to_interview" ADD CONSTRAINT "recruiter_to_interview_interview_id_interview_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interview"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_to_interview" ADD CONSTRAINT "recruiter_to_interview_recruiter_id_recruiter_user_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_vote" ADD CONSTRAINT "recruiter_vote_candidate_id_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_vote" ADD CONSTRAINT "recruiter_vote_recruiter_id_user_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_vote" ADD CONSTRAINT "recruiter_vote_voting_phase_id_voting_phase_id_fk" FOREIGN KEY ("voting_phase_id") REFERENCES "public"."voting_phase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_phase" ADD CONSTRAINT "recruitment_phase_recruitment_year_recruitment_year_fk" FOREIGN KEY ("recruitment_year") REFERENCES "public"."recruitment"("year") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_phase_status" ADD CONSTRAINT "recruitment_phase_status_phase_id_recruitment_phase_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."recruitment_phase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_phase_status" ADD CONSTRAINT "recruitment_phase_status_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot" ADD CONSTRAINT "slot_recruitment_year_recruitment_year_fk" FOREIGN KEY ("recruitment_year") REFERENCES "public"."recruitment"("year") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_recruitments" ADD CONSTRAINT "users_to_recruitments_recruitment_year_recruitment_year_fk" FOREIGN KEY ("recruitment_year") REFERENCES "public"."recruitment"("year") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_recruitments" ADD CONSTRAINT "users_to_recruitments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_phase" ADD CONSTRAINT "voting_phase_recruitment_year_recruitment_year_fk" FOREIGN KEY ("recruitment_year") REFERENCES "public"."recruitment"("year") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_phase_candidate" ADD CONSTRAINT "voting_phase_candidate_candidate_id_candidate_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidate"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_phase_candidate" ADD CONSTRAINT "voting_phase_candidate_voting_phase_id_voting_phase_id_fk" FOREIGN KEY ("voting_phase_id") REFERENCES "public"."voting_phase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_phase_status" ADD CONSTRAINT "voting_phase_status_candidate_id_user_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_phase_status" ADD CONSTRAINT "voting_phase_status_voting_phase_id_voting_phase_id_fk" FOREIGN KEY ("voting_phase_id") REFERENCES "public"."voting_phase"("id") ON DELETE no action ON UPDATE no action;