import { candidate } from "@/db/schema";
import {
  Application,
  db,
  Dynamic,
  Interview,
  RecruiterToCandidate,
  User,
} from "./db";
import { eq } from "drizzle-orm";
import { getFilenameUrl } from "./file-upload";

export type CandidateWithMetadata = User & {
  knownRecruiters: RecruiterToCandidate[];
  dynamic: { candidateId: string; dynamicId: number; dynamic: Dynamic };
  interview: Interview;
  application: (Application & { interests: string[] }) | null;
  dynamicClassification: string;
  interviewClassification: string;
};

export async function isCandidate(candidateId: string) {
  const query = await db.query.candidate.findFirst({
    where: eq(candidate.userId, candidateId),
  });

  return query !== null && query !== undefined;
}

export async function getCandidateWithMetadata(
  candidateId: string,
): Promise<CandidateWithMetadata> {
  const res = await db.query.candidate.findFirst({
    where: eq(candidate.userId, candidateId),
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

  return {
    ...res.user,
    image: await getFilenameUrl(res.user?.image),
    dynamic: res.dynamic,
    interview: res.interview,
    dynamicClassification: res.dynamicClassification,
    interviewClassification: res.interviewClassification,
    knownRecruiters: res.knownRecruiters,
    application: {
      ...res.application,
      profilePicture: await getFilenameUrl(res.application?.profilePicture),
      curriculum: await getFilenameUrl(res.application?.curriculum),
      interests: res.application?.interests.map((i) => i.interest),
    },
  };
}

export default async function getCandidateWithInterviewAndDynamic(
  candidateId: string,
) {
  return await db.query.candidate.findFirst({
    where: eq(candidate.userId, candidateId),
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
