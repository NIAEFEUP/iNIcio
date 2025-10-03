"use server";

import * as Y from "yjs";

import { SlotType } from "@/components/admin/slot-admin-calendar";
import {
  notification,
  recruiterAvailability,
  recruiterToDynamic,
  recruiterToInterview,
} from "@/db/schema";
import { db, User } from "@/lib/db";
import { and, eq, gte, lte } from "drizzle-orm";

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

export async function getAvailableRecruiters(
  start: Date,
  end: Date,
): Promise<User[]> {
  const results = await db.query.recruiterAvailability.findMany({
    where: and(
      gte(recruiterAvailability.start, start),
      lte(recruiterAvailability.start, end),
    ),
    with: {
      recruiter: {
        with: {
          recruiter: {
            with: {
              knownCandidates: true,
            },
          },
        },
      },
      recruitment: true,
    },
  });

  const r = results.map((r) => r.recruiter);
  return [...new Map(r.map((r) => [r.id, r])).values()];
}

export async function assignRecruiter(
  interviewId: number,
  userId: string,
  slotType: SlotType,
) {
  if (slotType === "interview") {
    await db.insert(recruiterToInterview).values({
      recruiterId: userId,
      interviewId,
    });
  } else {
    await db.insert(recruiterToDynamic).values({
      recruiterId: userId,
      dynamicId: interviewId,
    });
  }
}

export async function unassignRecruiter(
  interviewId: number,
  userId: string,
  slotType: SlotType,
) {
  if (slotType === "interview") {
    await db
      .delete(recruiterToInterview)
      .where(
        and(
          eq(recruiterToInterview.recruiterId, userId),
          eq(recruiterToInterview.interviewId, interviewId),
        ),
      );
  } else {
    await db
      .delete(recruiterToDynamic)
      .where(
        and(
          eq(recruiterToDynamic.recruiterId, userId),
          eq(recruiterToDynamic.dynamicId, interviewId),
        ),
      );
  }
}

export const mergeBlockNoteServerAction = async (
  existingUpdate: Uint8Array | null,
  incomingUpdate: ArrayBuffer | Uint8Array,
) => {
  const ydoc = new Y.Doc();

  // if (existingUpdate) {
  //   Y.applyUpdate(ydoc, existingUpdate);
  // }

  Y.applyUpdate(
    ydoc,
    incomingUpdate instanceof Uint8Array
      ? incomingUpdate
      : new Uint8Array(incomingUpdate),
  );

  const docArray = ydoc.getArray("document-store");
  if (docArray.length === 0) {
    docArray.delete(0, docArray.length);
  }

  return ydoc.getArray("document-store").toJSON();
};
