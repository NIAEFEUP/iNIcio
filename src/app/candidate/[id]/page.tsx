import { headers } from "next/headers";
import { redirect } from "next/navigation";

import CandidateCurriculum from "@/components/candidate/candidate-curriculum";
import { CandidateHeaderActions } from "@/components/candidate/candidate-header-actions";
import { CandidateLinksCard } from "@/components/candidate/candidate-links-card";
import CandidateAnswers from "@/components/candidate/page/candidate-answers";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import CandidateProfileCard from "@/components/candidate/page/candidate-profile-card";
import CandidateVotingStatus from "@/components/candidate/candidate-voting-status";
import CommentFrame from "@/components/comments/comment-frame";
import { PageHeader } from "@/components/layout/page-header";
import {
  EvaluationLayout,
  EvaluationPanel,
} from "@/components/layout/evaluation-layout";
import { EvaluationTabs } from "@/components/layout/evaluation-tabs";

import { submitApplicationComment } from "@/lib/application";
import { auth } from "@/lib/auth";
import { getCandidateWithMetadata } from "@/lib/candidate";
import { applicationAnswerCount } from "@/lib/candidate-answers";
import {
  getApplicationComments,
  updateApplicationComment,
} from "@/lib/comment";
import { getLatestVotingDecisionForCandidate } from "@/lib/voting";
import { getRecruiters, isRecruiter } from "@/lib/recruiter";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { requireRecruiterSession } from "@/lib/action-guard";

type CandidatePageProps = {
  params: any;
};

export default async function CandidatePage({ params }: CandidatePageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  const targetId = await getTargetRecruitmentId();

  if (!(await isRecruiter(session?.user.id, targetId))) redirect("/");

  const { id } = await params;

  const candidate = await getCandidateWithMetadata(id, targetId);

  const comments = await getApplicationComments(id, targetId);
  const votingDecision = await getLatestVotingDecisionForCandidate(
    id,
    targetId,
  );
  const recruiters = await getRecruiters(targetId);
  const answeredCount = applicationAnswerCount(candidate.application);

  const saveToDatabase = async (content: Array<any>) => {
    "use server";
    const user = await requireRecruiterSession(targetId);
    const commentId = await submitApplicationComment(
      id,
      content,
      user.id,
      targetId,
    );
    return commentId ? { success: true, id: commentId } : { success: false };
  };

  const editComment = async (commentId: number, content: Array<any>) => {
    "use server";
    const user = await requireRecruiterSession(targetId);
    return await updateApplicationComment(
      commentId,
      content,
      user.id,
      id,
      targetId,
    );
  };

  return (
    <EvaluationLayout
      header={
        <PageHeader
          backHref="/candidates"
          title={candidate.name}
          actions={
            <CandidateHeaderActions
              candidateId={candidate.id}
              currentPage="candidate"
              dynamicId={candidate.dynamic?.dynamicId}
              hasInterview={Boolean(candidate.interview)}
            />
          }
        />
      }
      sidebar={
        <>
          <CandidateProfileCard
            candidate={candidate}
            friends={candidate.knownRecruiters}
            authUser={
              session
                ? {
                    ...session.user,
                    image: session.user.image ?? "",
                    role: session.user.role as
                      "recruiter" | "candidate" | "admin",
                  }
                : null
            }
          />
          <CandidateLinksCard
            githubUrl={candidate.application?.github}
            linkedinUrl={candidate.application?.linkedIn}
            websiteUrl={candidate.application?.personalWebsite}
          />
          <CandidateVotingStatus votingDecision={votingDecision} />
        </>
      }
    >
      <EvaluationTabs
        defaultValue="answers"
        tabs={[
          {
            id: "answers",
            label: "Respostas",
            count: answeredCount,
            content: (
              <CandidateAnswers
                key={candidate.id}
                application={candidate.application}
              />
            ),
          },
          {
            id: "curriculum",
            label: "Currículo",
            hidden: !candidate.application?.curriculum,
            content: (
              <EvaluationPanel>
                <CandidateCurriculum application={candidate.application} />
              </EvaluationPanel>
            ),
          },
          {
            id: "comments",
            label: "Comentários",
            count: comments.length,
            content: (
              <CommentFrame>
                <CandidateComments
                  candidate={candidate}
                  type="application"
                  comments={comments}
                  saveToDatabase={saveToDatabase}
                  onEditComment={editComment}
                  recruiters={recruiters}
                />
              </CommentFrame>
            ),
          },
        ]}
      />
    </EvaluationLayout>
  );
}
