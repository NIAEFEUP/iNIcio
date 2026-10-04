import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

import { db } from "@/lib/db";

import {
  candidate,
  recruiterToCandidate,
  usersToRecruitments,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { isAdmin } from "@/lib/admin";

import { getTargetRecruitmentId } from "@/lib/selected-recruitment";

export async function PUT(req: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Marking a candidate as known is a recruiter-only action; admins cannot do
  // it even when they are also enrolled in the recruitment.
  if (await isAdmin(session.user.id)) {
    return NextResponse.json(
      { error: "Admins cannot mark candidates as known" },
      { status: 403 },
    );
  }

  let json: any;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const candidateId = json?.candidateId;
  if (typeof candidateId !== "string" || candidateId.length === 0) {
    return NextResponse.json({ error: "Invalid candidateId" }, { status: 400 });
  }

  const targetRecruitmentId =
    json?.recruitmentId ?? (await getTargetRecruitmentId());

  if (!targetRecruitmentId) {
    return NextResponse.json(
      { error: "No recruitment selected" },
      { status: 400 },
    );
  }

  if (!Number.isInteger(targetRecruitmentId)) {
    return NextResponse.json(
      { error: "Invalid recruitmentId" },
      { status: 400 },
    );
  }

  // Marking a candidate as known is a recruiter action scoped to the
  // recruitment they are enrolled in. Admins are deliberately excluded.
  const membership = await db.query.usersToRecruitments.findFirst({
    where: and(
      eq(usersToRecruitments.userId, session.user.id),
      eq(usersToRecruitments.recruitmentId, targetRecruitmentId),
    ),
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Only recruiters of this recruitment can mark candidates" },
      { status: 403 },
    );
  }

  const targetCandidate = await db.query.candidate.findFirst({
    where: and(
      eq(candidate.userId, candidateId),
      eq(candidate.recruitmentId, targetRecruitmentId),
    ),
  });

  if (!targetCandidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const known = await db.transaction(async (tx) => {
    const existing = await tx.query.recruiterToCandidate.findFirst({
      where: and(
        eq(recruiterToCandidate.recruiterId, session.user.id),
        eq(recruiterToCandidate.candidateId, candidateId),
        eq(recruiterToCandidate.recruitmentId, targetRecruitmentId),
      ),
    });

    if (existing) {
      await tx
        .delete(recruiterToCandidate)
        .where(
          and(
            eq(recruiterToCandidate.recruiterId, session.user.id),
            eq(recruiterToCandidate.candidateId, candidateId),
            eq(recruiterToCandidate.recruitmentId, targetRecruitmentId),
          ),
        );
      return false;
    }

    await tx
      .insert(recruiterToCandidate)
      .values({
        recruiterId: session.user.id,
        candidateId,
        recruitmentId: targetRecruitmentId,
      })
      .onConflictDoNothing();

    return true;
  });

  return NextResponse.json({ known });
}
