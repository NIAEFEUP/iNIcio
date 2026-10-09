CREATE TABLE "open_day_announcement" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruitment_id" integer NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"date" timestamp,
	"start_time" text DEFAULT '10:00' NOT NULL,
	"end_time" text DEFAULT '18:00' NOT NULL,
	"room" text DEFAULT 'B315' NOT NULL,
	"image" text DEFAULT '/images/B315.jpeg' NOT NULL,
	CONSTRAINT "open_day_announcement_recruitment_unique" UNIQUE("recruitment_id")
);
--> statement-breakpoint
ALTER TABLE "open_day_announcement" ADD CONSTRAINT "open_day_announcement_recruitment_id_recruitment_id_fk" FOREIGN KEY ("recruitment_id") REFERENCES "public"."recruitment"("id") ON DELETE cascade ON UPDATE no action;