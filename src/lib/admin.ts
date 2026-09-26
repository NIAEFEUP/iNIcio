import { admin } from "@/db/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { cache } from "react";

export const isAdmin = cache(async (userId: string) => {
  if (!userId) return false;

  return await db.query.admin.findFirst({
    where: eq(admin.userId, userId),
  });
});
