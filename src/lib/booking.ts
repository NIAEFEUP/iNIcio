import { db } from "./db";

export async function getBookings() {
  return await db.transaction(async (tx) => {
    const interviews = await tx.query.interview.findMany({
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
                knownCandidates: true,
              },
            },
          },
        },
      },
    });

    const dynamics = await tx.query.dynamic.findMany({
      with: {
        slot: true,
        candidates: true,
        recruiters: {
          with: {
            recruiter: {
              with: {
                user: true,
                knownCandidates: true,
              },
            },
          },
        },
      },
    });

    return {
      interview: [...interviews],
      dynamic: [...dynamics],
    };
  });
}
