ALTER TABLE "classification_value" RENAME TO "candidate_classification_value";--> statement-breakpoint
ALTER TABLE "candidate_classification_value" RENAME COLUMN "classification_id" TO "candidate_classification_id";--> statement-breakpoint
ALTER TABLE "candidate_classification_value" DROP CONSTRAINT "classification_value_classification_id_candidate_classification_id_fk";
--> statement-breakpoint
ALTER TABLE "candidate_to_classification" ALTER COLUMN "classification_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "candidate_classification_value" ADD CONSTRAINT "candidate_classification_value_candidate_classification_id_candidate_classification_id_fk" FOREIGN KEY ("candidate_classification_id") REFERENCES "public"."candidate_classification"("id") ON DELETE no action ON UPDATE no action;