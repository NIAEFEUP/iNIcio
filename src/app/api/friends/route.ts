import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/lib/db";

import { recruiterToCandidate } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { areFriends } from "@/lib/friend";
import { isRecruiter } from "@/lib/recruiter";
import { isAdmin } from "@/lib/admin";

import { getActiveRecruitment } from "@/lib/recruitment";

export async function PUT(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (
    !(await isRecruiter(session?.user.id)) &&
    !(await isAdmin(session?.user.id))
  )
    return new Response("Unauthorized", { status: 401 });

  const json = await req.json();

  const targetRecruitmentId =
    json.recruitmentId ?? (await getActiveRecruitment())?.id;

  if (!targetRecruitmentId) {
    return new Response("No active recruitment", { status: 400 });
  }

  if (await areFriends(session.user.id, json.candidateId)) {
    await db
      .delete(recruiterToCandidate)
      .where(
        and(
          eq(recruiterToCandidate.recruiterId, session.user.id),
          eq(recruiterToCandidate.candidateId, json.candidateId),
          eq(recruiterToCandidate.recruitmentId, targetRecruitmentId),
        ),
      );
  } else {
    await db.insert(recruiterToCandidate).values({
      recruiterId: session.user.id,
      candidateId: json.candidateId,
      recruitmentId: targetRecruitmentId,
    });
  }

  return new Response();
}
