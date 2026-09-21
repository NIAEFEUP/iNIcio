"use server";

import { SlotType } from "@/components/admin/slot-admin-calendar";
import {
  notification,
  recruiterAvailability,
  recruiterToDynamic,
  recruiterToInterview,
} from "@/db/schema";
import { db, User } from "@/lib/db";
import { and, asc, eq, gt, lt, sql } from "drizzle-orm";
import {
  getSessionUser,
  requireAdminSession,
  requireRecruiterSession,
} from "@/lib/action-guard";
import { getActiveRecruitment } from "@/lib/recruitment";
import { fromFullUrlToPath, getFilenameUrl } from "@/lib/file-upload";
import { deliverPendingNotifications } from "@/lib/notification-service";

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

/**
 * Delivers notifications whose time has come for the current user and returns
 * the new unread notifications created after `sinceId`. Used by the live
 * notifier to surface notifications as toasts.
 */
export async function pollNotifications(sinceId: number) {
  const user = await getSessionUser();

  await deliverPendingNotifications(user.id);

  return await db.query.notification.findMany({
    where: and(
      eq(notification.userId, user.id),
      eq(notification.isRead, false),
      gt(notification.id, sinceId),
    ),
    orderBy: asc(notification.id),
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
    sql`${recruiterAvailability.start} + make_interval(mins => ${recruiterAvailability.duration}) > ${sql.param(startUtc, recruiterAvailability.start)}`,
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

export async function getSignedProfilePictureUrl(targetPictureUrl: string) {
  const user = await getSessionUser();
  const cleanPath = fromFullUrlToPath(targetPictureUrl);

  if (
    !cleanPath.startsWith(`profiles/${user.id}/`) &&
    targetPictureUrl !== user.image
  ) {
    throw new Error("Unauthorized access to image file");
  }

  return await getFilenameUrl(targetPictureUrl);
}
