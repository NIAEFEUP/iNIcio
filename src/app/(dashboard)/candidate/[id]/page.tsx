import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import {
  getCandidateWithMetadata,
  getAdjacentCandidates,
} from "@/lib/candidate";
import { getApplicationComments } from "@/lib/comment";
import { getRecruiters } from "@/lib/recruiter";
import { CandidateDetailClient } from "@/components/candidate/candidate-detail-client";
import { DataErrorState } from "@/components/data-table/data-state-view";

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const targetId = await getTargetRecruitmentId();

  if (!(await isRecruiter(session.user.id, targetId))) {
    redirect("/");
  }

  let candidateData = null;
  let error: unknown = null;

  try {
    const [candidate, comments, recruiters, adjacentCandidates] =
      await Promise.all([
        getCandidateWithMetadata(id, targetId),
        getApplicationComments(id, session.user.id, targetId),
        getRecruiters(targetId),
        getAdjacentCandidates(id, targetId),
      ]);
    candidateData = { candidate, comments, recruiters, adjacentCandidates };
  } catch (err) {
    error = err;
  }

  if (error || !candidateData) {
    return (
      <DataErrorState
        title="Candidato não encontrado"
        message={error instanceof Error ? error.message : undefined}
      />
    );
  }

  return (
    <CandidateDetailClient
      id={id}
      initialCandidate={candidateData.candidate}
      initialComments={candidateData.comments}
      initialRecruiters={candidateData.recruiters}
      adjacentCandidates={candidateData.adjacentCandidates}
    />
  );
}
