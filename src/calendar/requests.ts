import { CALENDAR_ITENS_MOCK, COLORS, USERS_MOCK } from "@/calendar/mocks";
import { IEvent } from "./interfaces";
import { db } from "@/lib/db";
import { recruiterToDynamic, recruiterToInterview } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCandidateInterviewLink } from "@/lib/interview";
import { getDynamicLink } from "@/lib/dynamic";
import {
  getAllRecruiterAvailabilities,
  getAllRecruiters,
} from "@/lib/recruiter";
import { getFilenameUrl } from "@/lib/file-upload";

export const getEventAvailabilities = async () => {
  const calendarEvents: IEvent[] = [];

  const availabilities = await getAllRecruiterAvailabilities();

  await Promise.all(
    availabilities.map(async (availability) => {
      const slotStart = availability.start;
      const slotEnd = new Date(
        slotStart.getTime() + availability.duration * 60000,
      );

      calendarEvents.push({
        id: availability.id,
        startDate: slotStart.toISOString(),
        endDate: slotEnd.toISOString(),
        title: availability.recruiter.name,
        description: availability.recruiter.name,
        color: COLORS[availabilities.indexOf(availability) % COLORS.length],
        user: {
          name: availability.recruiter.name,
          picturePath: await getFilenameUrl(availability.recruiter.image),
          id: availability.recruiter.id,
        },
        link: "",
      });
    }),
  );

  return calendarEvents;
};

export const getEvents = async (userId: string) => {
  const calendarEvents: IEvent[] = [];

  const interviews = await db.query.interview.findMany({
    where: (i, { exists }) =>
      exists(
        db
          .select()
          .from(recruiterToInterview)
          .where(
            and(
              eq(recruiterToInterview.interviewId, i.id),
              eq(recruiterToInterview.recruiterId, userId),
            ),
          ),
      ),
    with: {
      slot: true,
      candidate: {
        with: {
          user: true,
        },
      },
      recruiters: {
        with: {
          recruiter: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  });

  const dynamics = await db.query.dynamic.findMany({
    where: (i, { exists }) =>
      exists(
        db
          .select()
          .from(recruiterToDynamic)
          .where(
            and(
              eq(recruiterToDynamic.dynamicId, i.id),
              eq(recruiterToDynamic.recruiterId, userId),
            ),
          ),
      ),
    with: {
      slot: true,
      candidates: {
        with: {
          candidate: { with: { user: true } },
        },
      },
      recruiters: {
        with: {
          recruiter: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  });

  interviews.forEach((interviewItem, index) => {
    const slotStart = interviewItem.slot.start;
    const slotEnd = new Date(
      slotStart.getTime() + interviewItem.slot.duration * 60000,
    );

    const assignedRecruiter =
      interviewItem.recruiters.length > 0
        ? interviewItem.recruiters[
            Math.floor(Math.random() * interviewItem.recruiters.length)
          ].recruiter.user
        : null;

    calendarEvents.push({
      id: index + 1,
      startDate: slotStart.toISOString(),
      endDate: slotEnd.toISOString(),
      title: "Entrevista",
      description: "Entrevista",
      color: COLORS[index % COLORS.length],
      user: { ...assignedRecruiter, picturePath: assignedRecruiter.image },
      link: getCandidateInterviewLink(interviewItem.candidateId),
      assigned: interviewItem.recruiters.map((r) => r.recruiter?.user?.name),
    });
  });

  dynamics.forEach((dynamicItem, index) => {
    const slotStart = dynamicItem.slot.start;
    const slotEnd = new Date(
      slotStart.getTime() + dynamicItem.slot.duration * 60000,
    );

    const assignedRecruiter =
      dynamicItem.recruiters.length > 0
        ? dynamicItem.recruiters[
            Math.floor(Math.random() * dynamicItem.recruiters.length)
          ].recruiter.user
        : null;

    calendarEvents.push({
      id: calendarEvents.length + 1,
      startDate: slotStart.toISOString(),
      endDate: slotEnd.toISOString(),
      title: "Dinâmica",
      description: "Dinâmica",
      color: COLORS[calendarEvents.length % COLORS.length],
      user: { ...assignedRecruiter, picturePath: assignedRecruiter.image },
      link: getDynamicLink(dynamicItem.id),
      assigned: dynamicItem.recruiters.map((r) => r.recruiter?.user?.name),
    });
  });

  return calendarEvents;
};

export const getUsers = async () => {
  // TO DO: implement this
  // Increase the delay to better see the loading state
  // await new Promise(resolve => setTimeout(resolve, 800));
  return USERS_MOCK;
};

export const getUsersRecruiters = async () => {
  const recruiters = await getAllRecruiters();

  return recruiters.map((recruiter) => ({
    id: recruiter.user.id,
    name: recruiter.user.name,
    picturePath: recruiter.user.image,
  }));
};
