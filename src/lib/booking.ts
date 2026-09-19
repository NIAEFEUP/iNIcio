import { db } from "./db";
import { getActiveRecruitment } from "./recruitment";

export async function getBookings(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;

  if (!targetId) return { interview: [], dynamic: [] };

  return await db.transaction(async (tx) => {
    const interviews = await tx.query.interview.findMany({
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
                knownCandidates: true,
                interviews: {
                  with: {
                    interview: {
                      with: {
                        slot: true,
                      },
                    },
                  },
                },
                dynamics: {
                  with: {
                    dynamic: {
                      with: {
                        slot: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const dynamics = await tx.query.dynamic.findMany({
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
                knownCandidates: true,
                interviews: {
                  with: {
                    interview: {
                      with: {
                        slot: true,
                      },
                    },
                  },
                },
                dynamics: {
                  with: {
                    dynamic: {
                      with: {
                        slot: true,
                      },
                    },
                  },
                },
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
