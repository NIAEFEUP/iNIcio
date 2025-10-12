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
import { and, eq, gte, lte, lt } from "drizzle-orm";
import { isRecruiter } from "@/lib/recruiter";

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
  const startUtc = new Date(start.toISOString());
  const endUtc = new Date(end.toISOString());

  const results = await db.query.recruiterAvailability.findMany({
    where: and(
      gte(recruiterAvailability.start, startUtc),
      lt(recruiterAvailability.start, endUtc),
    ),
    with: {
      recruiter: {
        with: {
          recruiter: {
            with: {
              knownCandidates: true,
              interviews: {
                with: {
                  interview: {
                    with: {
                      slot: true,
                    },
                  },
                },
              },
              dynamics: {
                with: {
                  dynamic: {
                    with: {
                      slot: true,
                    },
                  },
                },
              },
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
