import {
  application,
  candidate,
  candidateToDynamic,
  interview,
  user,
} from "@/db/schema";
import {
  Application,
  db,
  Dynamic,
  Interview,
  RecruiterToCandidate,
  Slot,
  User,
} from "./db";
import { and, eq, sql } from "drizzle-orm";
import { getFilenameUrl } from "./file-upload";
import { FilterRestriction } from "./restriction";
import { getActiveRecruitment } from "./recruitment";
import { getPreviousApplicationYears } from "./previous-applications";
import { getLatestVotingDecisionsForCandidates } from "./voting";

export interface CandidateSchedulingStats {
  total: number;
  unmarkedInterviews: number;
  unmarkedDynamics: number;
  unmarkedEither: number;
}

export type CandidateApplicationSummary = Pick<
  Application,
  | "id"
  | "recruitmentId"
  | "candidateId"
  | "submittedAt"
  | "studentNumber"
  | "linkedIn"
  | "github"
  | "personalWebsite"
  | "phone"
  | "degree"
  | "curricularYear"
  | "curriculum"
  | "accepted"
  | "experience"
  | "motivation"
  | "selfPromotion"
  | "interestJustification"
  | "recruitmentFirstInteraction"
  | "suggestions"
> & {
  interests: string[];
};

export type CandidateInterviewSummary = Pick<
  Interview,
  "id" | "recruitmentId" | "candidateId" | "slot" | "locked"
> & {
  slot?: Slot;
};

export type CandidateDynamicSummary = {
  candidateId: string;
  dynamicId: number;
  dynamic: Pick<Dynamic, "id" | "recruitmentId" | "slot" | "locked"> & {
    slot?: Slot;
  };
};

/** The list shape: the application carries only the columns list surfaces need. */
export type CandidateListMetadata = Omit<
  CandidateWithMetadata,
  "application" | "interview" | "dynamic"
> & {
  application: CandidateApplicationSummary | null;
  interview: CandidateInterviewSummary | null;
  dynamic: CandidateDynamicSummary | null;
};

/** Same as `CandidateListMetadata` with the phase's per-candidate completion flag. */
export type CandidateVotingMetadata = CandidateListMetadata & {
  isFinished: boolean;
};

export type CandidateWithMetadata = User & {
  knownRecruiters: RecruiterToCandidate[];
  dynamic: { candidateId: string; dynamicId: number; dynamic: Dynamic };
  interview: Interview;
  application: (Application & { interests: string[] }) | null;
  previousApplicationYears: Array<string>;
  dynamicClassification: string;
  interviewClassification: string;
  votingDecision?: {
    votingPhaseId: number;
    voteFinished: boolean;
    approveCount: number;
    rejectCount: number;
    decision: "approve" | "reject";
    createdAt: Date | null;
  } | null;
};

export enum CandidateFilterRestriction {
  ONLY_WITH_INTERVIEW_AND_DYNAMIC = "ONLY_WITH_INTERVIEW_AND_DYNAMIC",
}

function restrictInterviewAndDynamic(candidates: Array<CandidateListMetadata>) {
  return candidates.filter((c) => c.dynamic && c.interview);
}

export const candidateFilterRestrictions: FilterRestriction<
  Array<CandidateListMetadata>
> = {
  ONLY_WITH_INTERVIEW_AND_DYNAMIC: restrictInterviewAndDynamic,
};

export async function isCandidate(candidateId: string, recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;

  if (targetId) {
    const query = await db.query.candidate.findFirst({
      where: and(
        eq(candidate.userId, candidateId),
        eq(candidate.recruitmentId, targetId),
      ),
    });
    return query !== null && query !== undefined;
  }

  const query = await db.query.candidate.findFirst({
    where: eq(candidate.userId, candidateId),
  });

  return query !== null && query !== undefined;
}

export async function getCandidateSchedulingStats(
  recruitmentId?: number,
): Promise<CandidateSchedulingStats> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) {
    return {
      total: 0,
      unmarkedInterviews: 0,
      unmarkedDynamics: 0,
      unmarkedEither: 0,
    };
  }

  const rows = await db
    .select({
      candidateId: candidate.userId,
      hasInterview: sql<boolean>`CASE WHEN ${interview.id} IS NOT NULL THEN true ELSE false END`,
      hasDynamic: sql<boolean>`CASE WHEN ${candidateToDynamic.dynamicId} IS NOT NULL THEN true ELSE false END`,
    })
    .from(candidate)
    .innerJoin(
      application,
      and(
        eq(application.candidateId, candidate.userId),
        eq(application.recruitmentId, targetId),
      ),
    )
    .leftJoin(
      interview,
      and(
        eq(interview.candidateId, candidate.userId),
        eq(interview.recruitmentId, targetId),
      ),
    )
    .leftJoin(
      candidateToDynamic,
      and(
        eq(candidateToDynamic.candidateId, candidate.userId),
        eq(candidateToDynamic.recruitmentId, targetId),
      ),
    )
    .where(eq(candidate.recruitmentId, targetId));

  let unmarkedInterviews = 0;
  let unmarkedDynamics = 0;
  let unmarkedEither = 0;

  for (const row of rows) {
    if (!row.hasInterview) unmarkedInterviews++;
    if (!row.hasDynamic) unmarkedDynamics++;
    if (!row.hasInterview || !row.hasDynamic) unmarkedEither++;
  }

  return {
    total: rows.length,
    unmarkedInterviews,
    unmarkedDynamics,
    unmarkedEither,
  };
}

/**
 * Loads several candidates' list metadata in a fixed number of queries: one
 * candidate graph, one previous-years lookup, one batched voting-decision
 * lookup and one signing pass. Pass `candidateIds` to narrow the result to a
 * specific set (e.g. the candidates of a voting phase). The application only
 * carries the columns list surfaces need; use `getCandidateWithMetadata` when
 * the full application (free-text answers) is required.
 */
export async function getCandidatesWithMetadata(
  candidateIds?: Array<string>,
  recruitmentId?: number,
): Promise<Array<CandidateListMetadata>> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];
  if (candidateIds && candidateIds.length === 0) return [];

  const candidates = await db.query.candidate.findMany({
    where: (candidateTable, { eq, and, exists, inArray }) =>
      and(
        eq(candidateTable.recruitmentId, targetId),
        candidateIds ? inArray(candidateTable.userId, candidateIds) : undefined,
        exists(
          db
            .select()
            .from(application)
            .where(
              and(
                eq(application.candidateId, candidateTable.userId),
                eq(application.recruitmentId, targetId),
              ),
            ),
        ),
      ),
    with: {
      user: true,
      dynamic: {
        columns: {
          candidateId: true,
          dynamicId: true,
        },
        with: {
          dynamic: {
            columns: {
              id: true,
              slot: true,
              locked: true,
              recruitmentId: true,
            },
            with: {
              slot: true,
            },
          },
        },
      },
      interview: {
        columns: {
          id: true,
          slot: true,
          locked: true,
          recruitmentId: true,
          candidateId: true,
        },
        with: {
          slot: true,
        },
      },
      application: {
        columns: {
          id: true,
          recruitmentId: true,
          candidateId: true,
          submittedAt: true,
          studentNumber: true,
          linkedIn: true,
          github: true,
          personalWebsite: true,
          phone: true,
          degree: true,
          curricularYear: true,
          curriculum: true,
          accepted: true,
          experience: true,
          motivation: true,
          selfPromotion: true,
          interestJustification: true,
          recruitmentFirstInteraction: true,
          suggestions: true,
        },
        with: {
          interests: true,
        },
      },
      knownRecruiters: true,
    },
  });

  candidates.sort(
    (a, b) => (a.application?.id ?? 0) - (b.application?.id ?? 0),
  );

  const previousApplicationYears = await getPreviousApplicationYears(
    candidates.map((c) => ({
      userId: c.userId,
      studentNumber: c.application?.studentNumber,
    })),
    targetId,
  );

  const votingDecisions = await getLatestVotingDecisionsForCandidates(
    candidates.map((c) => c.userId),
    targetId,
  );

  return Promise.all(
    candidates.map(async (c) => ({
      ...c.user,
      image: await getFilenameUrl(c.user?.image),
      dynamic: c.dynamic as CandidateListMetadata["dynamic"],
      interview: c.interview as CandidateListMetadata["interview"],
      interviewClassification: c.interviewClassification ?? "none",
      dynamicClassification: c.dynamicClassification ?? "none",
      application: c.application
        ? {
            ...c.application,
            curriculum: await getFilenameUrl(c.application?.curriculum),
            interests: c.application?.interests.map((i) => i.interest),
          }
        : null,
      knownRecruiters: c.knownRecruiters,
      votingDecision: votingDecisions.get(c.userId) ?? null,
      previousApplicationYears: previousApplicationYears.get(c.userId) ?? [],
    })),
  );
}

export async function getAdjacentCandidates(
  candidateId: string,
  recruitmentId?: number,
): Promise<{
  prev: { id: string; name: string } | null;
  next: { id: string; name: string } | null;
}> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return { prev: null, next: null };

  const candidateList = await db
    .select({
      id: candidate.userId,
      name: user.name,
      appId: application.id,
    })
    .from(candidate)
    .innerJoin(user, eq(candidate.userId, user.id))
    .innerJoin(
      application,
      and(
        eq(application.candidateId, candidate.userId),
        eq(application.recruitmentId, targetId),
      ),
    )
    .where(eq(candidate.recruitmentId, targetId))
    .orderBy(application.id);

  const index = candidateList.findIndex((c) => c.id === candidateId);
  if (index === -1) return { prev: null, next: null };

  const prevItem = index > 0 ? candidateList[index - 1] : null;
  const nextItem =
    index < candidateList.length - 1 ? candidateList[index + 1] : null;

  return {
    prev: prevItem
      ? { id: prevItem.id, name: prevItem.name ?? "Candidato" }
      : null,
    next: nextItem
      ? { id: nextItem.id, name: nextItem.name ?? "Candidato" }
      : null,
  };
}

export async function getCandidateWithMetadata(
  candidateId: string,
  recruitmentId?: number,
): Promise<CandidateWithMetadata> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;

  if (!targetId) throw new Error("No recruitment specified or active");

  const whereClause = and(
    eq(candidate.userId, candidateId),
    eq(candidate.recruitmentId, targetId),
  );

  const res = await db.query.candidate.findFirst({
    where: whereClause,
    with: {
      user: true,
      dynamic: {
        with: {
          dynamic: {
            with: {
              slot: true,
            },
          },
        },
      },
      interview: true,
      application: {
        with: {
          interests: true,
        },
      },
      knownRecruiters: true,
    },
  });

  if (!res) {
    throw new Error(`Candidate with ID ${candidateId} not found`);
  }

  const votingDecision = await getLatestVotingDecisionsForCandidates(
    [candidateId],
    targetId,
  );
  const previousApplicationYears = await getPreviousApplicationYears(
    [{ userId: candidateId, studentNumber: res.application?.studentNumber }],
    targetId,
  );

  return {
    ...res.user,
    image: await getFilenameUrl(res.user?.image),
    dynamic: res.dynamic as CandidateWithMetadata["dynamic"],
    interview: res.interview as CandidateWithMetadata["interview"],
    interviewClassification: res.interviewClassification ?? "none",
    dynamicClassification: res.dynamicClassification ?? "none",
    application: res.application
      ? {
          ...res.application,
          curriculum: await getFilenameUrl(res.application?.curriculum),
          interests: res.application?.interests.map((i) => i.interest),
        }
      : null,
    knownRecruiters: res.knownRecruiters,
    votingDecision: votingDecision.get(candidateId) ?? null,
    previousApplicationYears: previousApplicationYears.get(candidateId) ?? [],
  };
}

export default async function getCandidateWithInterviewAndDynamic(
  candidateId: string,
  recruitmentId?: number,
) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;

  const whereClause = targetId
    ? and(
        eq(candidate.userId, candidateId),
        eq(candidate.recruitmentId, targetId),
      )
    : eq(candidate.userId, candidateId);

  return await db.query.candidate.findFirst({
    where: whereClause,
    with: {
      user: true,
      dynamic: {
        with: {
          dynamic: {
            with: {
              slot: true,
            },
          },
        },
      },
      interview: {
        with: {
          slot: true,
        },
      },
      application: {
        with: {
          interests: true,
        },
      },
    },
  });
}
