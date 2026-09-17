import { candidate, recruiterToCandidate } from "@/db/schema";
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
import { getLatestVotingDecisionForCandidate } from "./voting";

export type CandidateWithMetadata = User & {
  knownRecruiters: RecruiterToCandidate[];
  dynamic: { candidateId: string; dynamicId: number; dynamic: Dynamic };
  interview: Interview;
  application: (Application & { interests: string[] }) | null;
  dynamicClassification: string;
  interviewClassification: string;
  votingDecision?: {
    decision: "approve" | "reject";
    approveCount: number;
    rejectCount: number;
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

  const votingDecision = targetId
    ? await getLatestVotingDecisionForCandidate(candidateId, targetId)
    : null;

  return {
    ...res.user,
    image: await getFilenameUrl(res.user?.image),
    dynamic: res.dynamic as any,
    interview: res.interview as any,
    dynamicClassification: res.dynamicClassification ?? "none",
    interviewClassification: res.interviewClassification ?? "none",
    knownRecruiters: res.knownRecruiters,
    votingDecision,
    application: res.application
      ? {
          ...res.application,
          profilePicture: await getFilenameUrl(res.application?.profilePicture),
          curriculum: await getFilenameUrl(res.application?.curriculum),
          interests: res.application?.interests.map((i) => i.interest),
        }
      : null,
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
