import { recruiter } from "@/db/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { isAdmin } from "./admin";

export async function isRecruiter(id: string) {
  if (!id) return false;

  return (
    (await db.query.recruiter.findFirst({
      where: eq(recruiter.userId, id),
    })) || isAdmin(id)
  );
}

export async function getRecruiters() {
  return await db.query.user.findMany({
    where: (user, { exists }) =>
      exists(db.select().from(recruiter).where(eq(recruiter.userId, user.id))),
  });
}
