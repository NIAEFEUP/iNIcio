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
      },
    });

    const dynamics = await tx.query.dynamic.findMany({
      with: {
        slot: true,
        candidates: true,
      },
    });

    return {
      interview: [...interviews],
      dynamic: [...dynamics],
    };
  });
}
