import { application, candidate } from "@/db/schema";
import {
  Application,
  db,
  Dynamic,
  Interview,
  RecruiterToCandidate,
  User,
} from "./db";
import { and, eq } from "drizzle-orm";
import { getFilenameUrl } from "./file-upload";
import { FilterRestriction } from "./restriction";
import { getActiveRecruitment } from "./recruitment";
import { getPreviousApplicationYears } from "./previous-applications";
import { getLatestVotingDecisionsForCandidates } from "./voting";

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

function restrictInterviewAndDynamic(candidates: Array<CandidateWithMetadata>) {
  return candidates.filter((c) => c.dynamic && c.interview);
}

export const candidateFilterRestrictions: FilterRestriction<
  Array<CandidateWithMetadata>
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

/**
 * Loads several candidates' full metadata in a fixed number of queries: one
 * candidate graph, one previous-years lookup, one batched voting-decision
 * lookup and one signing pass. Pass `candidateIds` to narrow the result to a
 * specific set (e.g. the candidates of a voting phase).
 */
export async function getCandidatesWithMetadata(
  candidateIds?: Array<string>,
  recruitmentId?: number,
): Promise<Array<CandidateWithMetadata>> {
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
      dynamic: c.dynamic as CandidateWithMetadata["dynamic"],
      interview: c.interview as CandidateWithMetadata["interview"],
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

export async function getCandidateWithMetadata(
  candidateId: string,
  recruitmentId?: number,
): Promise<CandidateWithMetadata> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;

  if (!targetId) throw new Error("No recruitment specified or active");

  const [candidateData] = await getCandidatesWithMetadata(
    [candidateId],
    targetId,
  );

  if (!candidateData) {
    throw new Error(`Candidate with ID ${candidateId} not found`);
  }

  return candidateData;
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
