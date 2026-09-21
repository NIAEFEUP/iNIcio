import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/lib/db";

import {
  candidate,
  recruiterToCandidate,
  usersToRecruitments,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { areFriends } from "@/lib/friend";
import { isAdmin } from "@/lib/admin";

import { getActiveRecruitment } from "@/lib/recruitment";

export async function PUT(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let json: any;
  try {
    json = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const candidateId = json?.candidateId;
  if (typeof candidateId !== "string" || candidateId.length === 0) {
    return new Response("Invalid candidateId", { status: 400 });
  }

  const targetRecruitmentId =
    json?.recruitmentId ?? (await getActiveRecruitment())?.id;

  if (!targetRecruitmentId) {
    return new Response("No active recruitment", { status: 400 });
  }

  if (!Number.isInteger(targetRecruitmentId)) {
    return new Response("Invalid recruitmentId", { status: 400 });
  }

  const isAuthorized =
    (await isAdmin(session.user.id)) ||
    (await db.query.usersToRecruitments.findFirst({
      where: and(
        eq(usersToRecruitments.userId, session.user.id),
        eq(usersToRecruitments.recruitmentId, targetRecruitmentId),
      ),
    })) !== undefined;

  if (!isAuthorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  const targetCandidate = await db.query.candidate.findFirst({
    where: and(
      eq(candidate.userId, candidateId),
      eq(candidate.recruitmentId, targetRecruitmentId),
    ),
  });

  if (!targetCandidate) {
    return new Response("Candidate not found", { status: 404 });
  }

  if (await areFriends(session.user.id, candidateId, targetRecruitmentId)) {
    await db
      .delete(recruiterToCandidate)
      .where(
        and(
          eq(recruiterToCandidate.recruiterId, session.user.id),
          eq(recruiterToCandidate.candidateId, candidateId),
          eq(recruiterToCandidate.recruitmentId, targetRecruitmentId),
        ),
      );
  } else {
    await db.insert(recruiterToCandidate).values({
      recruiterId: session.user.id,
      candidateId,
      recruitmentId: targetRecruitmentId,
    });
  }

  return new Response();
}
