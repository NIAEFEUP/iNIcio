import { and, eq, inArray, lt, or } from "drizzle-orm";

import { application, recruitment } from "@/db/schema";
import { db } from "./db";
import { getRecruitmentById } from "./recruitment";

export interface CandidateIdentity {
  userId: string;
  studentNumber?: number | null;
}

/**
 * Lective years in which each candidate already applied, before the recruitment
 * being viewed. A candidate is matched either by account or by student number,
 * so someone who signed up again with a new account is still recognized.
 */
export async function getPreviousApplicationYears(
  identities: Array<CandidateIdentity>,
  recruitmentId: number,
): Promise<Map<string, Array<string>>> {
  const years = new Map<string, Array<string>>();
  if (identities.length === 0) return years;

  const viewed = await getRecruitmentById(recruitmentId);
  if (!viewed) return years;

  const userIds = [...new Set(identities.map((i) => i.userId))];
  const studentNumbers = [
    ...new Set(
      identities
        .map((i) => i.studentNumber)
        .filter((n): n is number => typeof n === "number"),
    ),
  ];

  const rows = await db
    .select({
      candidateId: application.candidateId,
      studentNumber: application.studentNumber,
      lectiveYear: recruitment.lectiveYear,
    })
    .from(application)
    .innerJoin(recruitment, eq(recruitment.id, application.recruitmentId))
    .where(
      and(
        lt(recruitment.start, viewed.start),
        or(
          inArray(application.candidateId, userIds),
          studentNumbers.length > 0
            ? inArray(application.studentNumber, studentNumbers)
            : undefined,
        ),
      ),
    );

  const byUserId = new Map<string, Set<string>>();
  const byStudentNumber = new Map<number, Set<string>>();

  for (const row of rows) {
    const forUser = byUserId.get(row.candidateId) ?? new Set<string>();
    forUser.add(row.lectiveYear);
    byUserId.set(row.candidateId, forUser);

    const forNumber =
      byStudentNumber.get(row.studentNumber) ?? new Set<string>();
    forNumber.add(row.lectiveYear);
    byStudentNumber.set(row.studentNumber, forNumber);
  }

  for (const identity of identities) {
    const found = new Set([
      ...(byUserId.get(identity.userId) ?? []),
      ...(typeof identity.studentNumber === "number"
        ? (byStudentNumber.get(identity.studentNumber) ?? [])
        : []),
    ]);

    years.set(
      identity.userId,
      [...found].sort((a, b) => b.localeCompare(a)),
    );
  }

  return years;
}
