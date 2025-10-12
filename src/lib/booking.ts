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
