import { db } from "@/lib/db";
import { recruiterToInterview, recruiterToDynamic } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCandidateInterviewLink } from "@/lib/interview";
import { getDynamicLink } from "@/lib/dynamic";
import {
  getAllRecruiterAvailabilities,
  getAllRecruiters,
} from "@/lib/recruiter";
import { getActiveRecruitment } from "@/lib/recruitment";

export interface RecruiterAgendaEvent {
  id: string;
  type: "interview" | "dynamic";
  title: string;
  start: Date;
  end: Date;
  duration: number;
  link: string;
  candidate?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  candidatesCount?: number;
  candidates?: Array<{
    id: string;
    name: string;
    email?: string;
    image: string | null;
  }>;
  recruiters: Array<{
    id: string;
    name: string;
    image: string | null;
  }>;
}

export async function getRecruiterAgendaEvents(
  userId: string,
  recruitmentId?: number,
): Promise<RecruiterAgendaEvent[]> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  const [interviews, dynamics] = await Promise.all([
    db.query.interview.findMany({
      where: (i, { exists, and: andWhere, eq: eqWhere }) => {
        const conditions = [
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
        ];
        if (targetId) {
          conditions.push(eqWhere(i.recruitmentId, targetId));
        }
        return andWhere(...conditions);
      },
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
    }),
    db.query.dynamic.findMany({
      where: (i, { exists, and: andWhere, eq: eqWhere }) => {
        const conditions = [
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
        ];
        if (targetId) {
          conditions.push(eqWhere(i.recruitmentId, targetId));
        }
        return andWhere(...conditions);
      },
      with: {
        slot: true,
        candidates: {
          with: {
            candidate: {
              with: {
                user: true,
              },
            },
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
    }),
  ]);

  const events: RecruiterAgendaEvent[] = [];

  for (const item of interviews) {
    if (!item.slot?.start) continue;
    const start = new Date(item.slot.start);
    const duration = item.slot.duration ?? 30;
    const end = new Date(start.getTime() + duration * 60_000);

    events.push({
      id: `interview-${item.id}`,
      type: "interview",
      title: "Entrevista",
      start,
      end,
      duration,
      link: getCandidateInterviewLink(item.candidateId),
      candidate: item.candidate?.user
        ? {
            id: item.candidate.user.id,
            name: item.candidate.user.name,
            email: item.candidate.user.email,
            image: item.candidate.user.image,
          }
        : undefined,
      recruiters: (item.recruiters || [])
        .filter((r) => r?.recruiter?.user)
        .map((r) => ({
          id: r.recruiter.user.id,
          name: r.recruiter.user.name,
          image: r.recruiter.user.image,
        })),
    });
  }

  for (const item of dynamics) {
    if (!item.slot?.start) continue;
    const start = new Date(item.slot.start);
    const duration = item.slot.duration ?? 45;
    const end = new Date(start.getTime() + duration * 60_000);

    const candidatesList = (item.candidates || [])
      .filter((c) => c?.candidate?.user)
      .map((c) => ({
        id: c.candidate.user.id,
        name: c.candidate.user.name,
        email: c.candidate.user.email,
        image: c.candidate.user.image,
      }));

    events.push({
      id: `dynamic-${item.id}`,
      type: "dynamic",
      title: "Dinâmica",
      start,
      end,
      duration,
      link: getDynamicLink(item.id),
      candidatesCount: candidatesList.length,
      candidates: candidatesList,
      recruiters: (item.recruiters || [])
        .filter((r) => r?.recruiter?.user)
        .map((r) => ({
          id: r.recruiter.user.id,
          name: r.recruiter.user.name,
          image: r.recruiter.user.image,
        })),
    });
  }

  // Sort chronological
  events.sort((a, b) => a.start.getTime() - b.start.getTime());

  return events;
}

export interface TeamRecruiter {
  id: string;
  name: string;
  email?: string | null;
  image: string | null;
}

export interface TeamAvailabilitySlot {
  id: number;
  start: Date;
  duration: number;
  recruiter: TeamRecruiter;
}

export async function getTeamAvailabilitiesData(
  recruitmentId?: number,
): Promise<{
  availabilities: TeamAvailabilitySlot[];
  recruiters: TeamRecruiter[];
}> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) {
    return { availabilities: [], recruiters: [] };
  }

  const [rawAvailabilities, enrolledRecruiters] = await Promise.all([
    getAllRecruiterAvailabilities(targetId),
    getAllRecruiters(targetId),
  ]);

  const recruiters: TeamRecruiter[] = enrolledRecruiters.map((r) => ({
    id: r.user.id,
    name: r.user.name,
    email: r.user.email,
    image: r.user.image,
  }));

  const recruiterMap = new Map<string, TeamRecruiter>(
    recruiters.map((r) => [r.id, r]),
  );

  const availabilities: TeamAvailabilitySlot[] = [];
  for (const a of rawAvailabilities) {
    const rec = recruiterMap.get(a.recruiterId);
    if (!rec) continue;
    availabilities.push({
      id: a.id,
      start: new Date(a.start),
      duration: a.duration,
      recruiter: rec,
    });
  }

  return { availabilities, recruiters };
}
