"use server";

import { db } from "@/lib/db";
import { openDayAnnouncement } from "@/db/schema";
import { requireAdminSession } from "./action-guard";
import { getOpenDayAnnouncementByRecruitmentId } from "./open-day";

export interface OpenDayAnnouncementInput {
  enabled: boolean;
  date: string | null;
  startTime: string;
  endTime: string;
  room: string;
  image?: string;
}

export async function getOpenDayAnnouncementAction(recruitmentId: number) {
  await requireAdminSession();
  const announcement =
    await getOpenDayAnnouncementByRecruitmentId(recruitmentId);

  if (!announcement) {
    return {
      enabled: false,
      date: "",
      startTime: "10:00",
      endTime: "18:00",
      room: "B315",
      image: "/images/B315.jpeg",
    };
  }

  return {
    enabled: announcement.enabled,
    date: announcement.date
      ? new Date(announcement.date).toISOString().slice(0, 10)
      : "",
    startTime: announcement.startTime || "10:00",
    endTime: announcement.endTime || "18:00",
    room: announcement.room || "B315",
    image: announcement.image || "/images/B315.jpeg",
  };
}

export async function saveOpenDayAnnouncementAction(
  recruitmentId: number,
  input: OpenDayAnnouncementInput,
) {
  await requireAdminSession();

  const parsedDate = input.enabled && input.date ? new Date(input.date) : null;

  if (input.enabled && (!input.date || Number.isNaN(parsedDate?.getTime()))) {
    throw new Error(
      "A data do NI Open Day é obrigatória quando o anúncio está ativo",
    );
  }

  const values = {
    recruitmentId,
    enabled: input.enabled,
    date: parsedDate,
    startTime: input.startTime.trim() || "10:00",
    endTime: input.endTime.trim() || "18:00",
    room: input.room.trim() || "B315",
    image: input.image.trim() || "/images/B315.jpeg",
  };

  const [saved] = await db
    .insert(openDayAnnouncement)
    .values(values)
    .onConflictDoUpdate({
      target: openDayAnnouncement.recruitmentId,
      set: {
        enabled: values.enabled,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        room: values.room,
        image: values.image,
      },
    })
    .returning();

  return saved;
}
