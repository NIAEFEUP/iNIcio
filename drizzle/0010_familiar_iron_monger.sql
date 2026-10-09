CREATE TABLE "application_comment_vote" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "application_comment_vote_unique" UNIQUE("comment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "dynamic_comment_vote" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dynamic_comment_vote_unique" UNIQUE("comment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "interview_comment_vote" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "interview_comment_vote_unique" UNIQUE("comment_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "application_comment_vote" ADD CONSTRAINT "application_comment_vote_comment_id_application_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."application_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_comment_vote" ADD CONSTRAINT "application_comment_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_comment_vote" ADD CONSTRAINT "dynamic_comment_vote_comment_id_dynamic_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."dynamic_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_comment_vote" ADD CONSTRAINT "dynamic_comment_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_comment_vote" ADD CONSTRAINT "interview_comment_vote_comment_id_interview_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."interview_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_comment_vote" ADD CONSTRAINT "interview_comment_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;