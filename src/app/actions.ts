"use server";

import { notification } from "@/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function markNotificationAsRead(id: number) {
  return await db.transaction(async (tx) => {
    await tx
      .update(notification)
      .set({
        isRead: true,
      })
      .where(eq(notification.id, id));
  });
}
