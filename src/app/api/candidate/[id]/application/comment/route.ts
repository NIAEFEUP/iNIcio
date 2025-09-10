import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/lib/db";

import { addApplicationComment } from "@/lib/comment";
import { application } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { id: candidateId } = await params;

  // if (!session || session.user.role !== "recruiter")
  //   return new Response("Unauthorized", { status: 401 });

  const json = await req.json();

  const app = await db
    .select()
    .from(application)
    .where(eq(application.candidateId, candidateId));

  if (app.length === 0)
    return new Response("Application not found", { status: 404 });

  await addApplicationComment(app[0].id, json.content, session.user.id);

  return new Response();
}
