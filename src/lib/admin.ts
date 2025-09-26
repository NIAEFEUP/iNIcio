import { admin } from "@/db/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export async function isAdmin(userId: string) {
  if (!userId) return false;

  return await db.query.admin.findFirst({
    where: eq(admin.userId, userId),
  });
}
