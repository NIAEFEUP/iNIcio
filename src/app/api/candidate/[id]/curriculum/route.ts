import { getSession } from "@/lib/auth";
import { getCandidateWithMetadata } from "@/lib/candidate";
import { isRecruiter } from "@/lib/recruiter";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";

export async function GET(_request: Request, context: any) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id: candidateId } = await context.params;
  const recruitmentId = await getTargetRecruitmentId();

  if (!recruitmentId) {
    return new Response("No recruitment selected", { status: 404 });
  }

  if (!(await isRecruiter(session.user.id, recruitmentId))) {
    return new Response("Unauthorized", { status: 403 });
  }

  let candidate;
  try {
    candidate = await getCandidateWithMetadata(candidateId, recruitmentId);
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return new Response("Candidate not found", { status: 404 });
    }
    console.error("Curriculum candidate lookup failed:", error);
    return new Response("Internal server error", { status: 500 });
  }

  const curriculumUrl = candidate.application?.curriculum;

  if (!curriculumUrl) {
    return new Response("Curriculum not found", { status: 404 });
  }

  const curriculum = await fetch(curriculumUrl);
  if (!curriculum.ok || !curriculum.body) {
    return new Response("Curriculum not available", { status: 502 });
  }

  return new Response(curriculum.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=300",
    },
  });
}
