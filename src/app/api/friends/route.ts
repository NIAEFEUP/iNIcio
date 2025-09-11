import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/lib/db";

import { recruiterToCandidate } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { areFriends } from "@/lib/friend";

export async function PUT(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (
    !session ||
    (session.user.role !== "recruiter" && session.user.role !== "admin")
  )
    return new Response("Unauthorized", { status: 401 });

  const json = await req.json();

  if (await areFriends(session.user.id, json.candidateId)) {
    await db
      .delete(recruiterToCandidate)
      .where(
        and(
          eq(recruiterToCandidate.recruiterId, session.user.id),
          eq(recruiterToCandidate.candidateId, json.candidateId),
        ),
      );
  } else {
    await db.insert(recruiterToCandidate).values({
      recruiterId: session.user.id,
      candidateId: json.candidateId,
    });
  }

  return new Response();
}
