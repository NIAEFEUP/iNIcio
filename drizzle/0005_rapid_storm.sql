DELETE FROM "recruiter_availability" a
USING "recruiter_availability" b
WHERE a.id > b.id
  AND a."start" = b."start"
  AND a.duration = b.duration
  AND a.recruiter_id = b.recruiter_id
  AND a.recruitment_id = b.recruitment_id;

ALTER TABLE "recruiter_availability" ADD CONSTRAINT "recruiter_availability_unique" UNIQUE("start","duration","recruiter_id","recruitment_id");
