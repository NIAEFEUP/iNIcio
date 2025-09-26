import { recruiter } from "@/db/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function isRecruiter(id: string) {
  if (!id) return false;

  return await db.query.recruiter.findFirst({
    where: eq(recruiter.userId, id),
  });
}
