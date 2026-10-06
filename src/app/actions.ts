"use server";

import { revalidatePath } from "next/cache";
import { SlotType } from "@/components/admin/slot-admin-calendar";
import {
  dynamic,
  interview,
  notification,
  recruiter,
  recruiterToDynamic,
  recruiterToInterview,
  slot,
  usersToRecruitments,
} from "@/db/schema";
import { db, Slot, User } from "@/lib/db";
import { and, asc, eq, gt } from "drizzle-orm";
import {
  getSessionUser,
  requireAdminSession,
  requireRecruiterSession,
} from "@/lib/action-guard";
import { getActiveRecruitment } from "@/lib/recruitment";
import { fromFullUrlToPath, getFilenameUrl } from "@/lib/file-upload";
import { deliverPendingNotifications } from "@/lib/notification-service";
import {
  availabilityOverlapCondition,
  isRecruiterAvailableForSlot,
} from "@/lib/recruiter-availability";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";

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

  const results = await db.query.recruiterAvailability.findMany({
    where: availabilityOverlapCondition(startUtc, endUtc, targetId),
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

export async function getAllTeamRecruiters(
  recruitmentId?: number,
): Promise<User[]> {
  await requireRecruiterSession(recruitmentId);

  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  const results = await db.query.usersToRecruitments.findMany({
    where: eq(usersToRecruitments.recruitmentId, targetId),
    with: {
      user: {
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
    },
  });

  const users = results.map((r) => r.user);
  return [...new Map(users.map((u) => [u.id, u])).values()];
}

export async function getReallocationSlotOptions() {
  await requireAdminSession();

  const recruitmentId = await getTargetRecruitmentId();
  if (!recruitmentId) {
    return {
      interview: [] as Slot[],
    };
  }

  const slots = await db
    .select()
    .from(slot)
    .where(
      and(
        eq(slot.recruitmentId, recruitmentId),
        eq(slot.type, "interview"),
        gt(slot.quantity, 0),
      ),
    );

  return {
    interview: slots,
  };
}

export async function assignRecruiter(
  interviewId: number,
  userId: string,
  slotType: SlotType,
  force: boolean = false,
) {
  await requireAdminSession();

  await db.transaction(async (tx) => {
    // Serialize scheduling writes for this recruiter: the row lock makes the
    // availability check and the insert atomic, so two concurrent assignments
    // cannot both pass the overlap check.
    const locked = await tx
      .select({ userId: recruiter.userId })
      .from(recruiter)
      .where(eq(recruiter.userId, userId))
      .for("update");

    if (locked.length === 0) {
      throw new Error("Recrutador não encontrado.");
    }

    if (slotType === "interview") {
      const target = await tx.query.interview.findFirst({
        where: eq(interview.id, interviewId),
        with: { slot: true },
      });

      if (!target) throw new Error("Entrevista não encontrada.");

      if (!force) {
        const available = await isRecruiterAvailableForSlot(
          userId,
          target.recruitmentId,
          target.slot.start,
          target.slot.duration,
          { excludeInterviewId: interviewId },
          tx,
        );

        if (!available) {
          throw new Error("O recrutador não está disponível neste horário.");
        }
      }

      await tx
        .insert(recruiterToInterview)
        .values({
          recruiterId: userId,
          interviewId,
        })
        .onConflictDoNothing();
    } else {
      const target = await tx.query.dynamic.findFirst({
        where: eq(dynamic.id, interviewId),
        with: { slot: true },
      });

      if (!target) throw new Error("Dinâmica não encontrada.");

      if (!force) {
        const available = await isRecruiterAvailableForSlot(
          userId,
          target.recruitmentId,
          target.slot.start,
          target.slot.duration,
          { excludeDynamicId: interviewId },
          tx,
        );

        if (!available) {
          throw new Error("O recrutador não está disponível neste horário.");
        }
      }

      await tx
        .insert(recruiterToDynamic)
        .values({
          recruiterId: userId,
          dynamicId: interviewId,
        })
        .onConflictDoNothing();
    }
  });

  revalidatePath("/admin/bookings");
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

  revalidatePath("/admin/bookings");
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
