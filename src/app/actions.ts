"use server";

import { SlotType } from "@/components/admin/slot-admin-calendar";
import {
  notification,
  recruiterAvailability,
  recruiterToDynamic,
  recruiterToInterview,
} from "@/db/schema";
import { db, User } from "@/lib/db";
import { and, eq, lt, sql } from "drizzle-orm";
import {
  getSessionUser,
  requireAdminSession,
  requireRecruiterSession,
} from "@/lib/action-guard";
import { getActiveRecruitment } from "@/lib/recruitment";

export async function markNotificationAsRead(id: number) {
  const user = await getSessionUser();

  return await db.transaction(async (tx) => {
    await tx
      .update(notification)
      .set({
        isRead: true,
      })
      .where(and(eq(notification.id, id), eq(notification.userId, user.id)));
  });
}

export async function getAvailableRecruiters(
  start: Date,
  end: Date,
  recruitmentId?: number,
): Promise<User[]> {
  await requireRecruiterSession(recruitmentId);

  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];
  const startUtc = new Date(start.toISOString());
  const endUtc = new Date(end.toISOString());

  const conditions = [
    lt(recruiterAvailability.start, endUtc),
    sql`${recruiterAvailability.start} + make_interval(mins => ${recruiterAvailability.duration}) > ${startUtc}`,
    eq(recruiterAvailability.recruitmentId, targetId),
  ];

  const results = await db.query.recruiterAvailability.findMany({
    where: and(...conditions),
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
  await requireAdminSession();

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
  await requireAdminSession();

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
