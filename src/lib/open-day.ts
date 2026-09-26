import { db, OpenDayAnnouncement } from "@/lib/db";
import { openDayAnnouncement } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getActiveRecruitment, getRecruitmentById } from "./recruitment";

export async function getOpenDayAnnouncementByRecruitmentId(
  recruitmentId: number,
): Promise<OpenDayAnnouncement | null> {
  const [result] = await db
    .select()
    .from(openDayAnnouncement)
    .where(eq(openDayAnnouncement.recruitmentId, recruitmentId));

  return result || null;
}

export async function getOpenDayAnnouncement(recruitmentId?: number) {
  const targetRecruitment = recruitmentId
    ? await getRecruitmentById(recruitmentId)
    : await getActiveRecruitment();

  if (!targetRecruitment) return null;

  const announcement = await getOpenDayAnnouncementByRecruitmentId(
    targetRecruitment.id,
  );

  if (!announcement || !announcement.enabled || !announcement.date) {
    return null;
  }

  return {
    id: announcement.id,
    recruitmentId: announcement.recruitmentId,
    enabled: announcement.enabled,
    date: announcement.date,
    startTime: announcement.startTime || "10:00",
    endTime: announcement.endTime || "18:00",
    room: announcement.room || "B315",
    image: announcement.image || "/images/B315.jpeg",
  };
}
