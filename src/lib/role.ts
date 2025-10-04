import { eq } from "drizzle-orm";
import { db } from "./db";
import { admin, recruiter } from "@/db/schema";

export type Role = "admin" | "recruiter" | "candidate";

export async function getRole(id: string) {
  const isAdmin = await db.query.admin.findFirst({
    where: eq(admin.userId, id),
  });

  if (isAdmin) return "admin";

  const isRecruiter = await db.query.recruiter.findFirst({
    where: eq(recruiter.userId, id),
  });

  if (isRecruiter) return "recruiter";

  return "candidate";
}
