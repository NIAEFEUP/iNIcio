import { db } from "./db";
import { getActiveRecruitment } from "./recruitment";

export async function getBookings(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;

  if (!targetId) return { interview: [], dynamic: [] };

  const [interviews, dynamics] = await Promise.all([
    db.query.interview.findMany({
      where: (interview, { eq }) => eq(interview.recruitmentId, targetId),
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
      where: (dynamic, { eq }) => eq(dynamic.recruitmentId, targetId),
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

  return {
    interview: interviews,
    dynamic: dynamics,
  };
}
