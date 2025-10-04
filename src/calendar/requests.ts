import { CALENDAR_ITENS_MOCK, COLORS, USERS_MOCK } from "@/calendar/mocks";
import { IEvent } from "./interfaces";
import { db } from "@/lib/db";
import { recruiterToDynamic, recruiterToInterview } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCandidateInterviewLink } from "@/lib/interview";
import { getDynamicLink } from "@/lib/dynamic";

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
