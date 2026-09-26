import { getSession } from "@/lib/auth";

import { submitApplicationComment } from "@/lib/application";
import { getActiveRecruitment } from "@/lib/recruitment";
import { isRecruiter } from "@/lib/recruiter";

export async function POST(req: Request, context: any) {
  const session = await getSession();

  const { id: candidateId } = await context.params;

  if (!session) return new Response("Unauthorized", { status: 401 });

  const activeRecruitment = await getActiveRecruitment();
  if (!activeRecruitment) {
    return new Response("No active recruitment", { status: 400 });
  }

  if (!(await isRecruiter(session.user.id, activeRecruitment.id)))
    return new Response("Unauthorized", { status: 401 });

  let json: any;
  try {
    json = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!Array.isArray(json?.content)) {
    return new Response("Invalid content", { status: 400 });
  }

  const ok = await submitApplicationComment(
    candidateId,
    json.content,
    session.user.id,
    activeRecruitment.id,
  );

  if (!ok) return new Response("Application not found", { status: 404 });

  return new Response();
}
