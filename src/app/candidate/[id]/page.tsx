"use client";

import { useParams } from "next/navigation";
import { useSWRConfig } from "swr";

import CandidateCurriculum from "@/components/candidate/candidate-curriculum";
import { CandidateHeaderActions } from "@/components/candidate/candidate-header-actions";
import { CandidateNavigation } from "@/components/candidate/candidate-navigation";
import CandidateAnswers from "@/components/candidate/page/candidate-answers";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import { CandidateModularInfo } from "@/components/candidate/card";
import CommentFrame from "@/components/comments/comment-frame";
import { PageHeader } from "@/components/layout/page-header";
import {
  EvaluationLayout,
  EvaluationPanel,
} from "@/components/layout/evaluation-layout";
import { EvaluationTabs } from "@/components/layout/evaluation-tabs";
import { EvaluationSkeleton } from "@/components/layout/evaluation-skeleton";
import { DataErrorState } from "@/components/data-table/data-state-view";

import {
  editApplicationComment,
  saveApplicationComment,
  voteApplicationComment,
} from "@/app/candidate/actions";
import { applicationAnswerCount } from "@/lib/candidate-answers";
import { useAuth } from "@/hooks/use-auth";
import { useRecruitment } from "@/lib/contexts/recruitment-context";
import {
  applicationCommentsKey,
  useApplicationComments,
  useCandidateData,
  useRecruiters,
} from "@/lib/hooks/candidates/use-candidate-data";

export default function CandidatePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: candidate, isLoading, error } = useCandidateData(id);
  const { data: commentsData } = useApplicationComments(id);
  const { data: recruitersData } = useRecruiters();
  const { user } = useAuth();
  const { mutate } = useSWRConfig();
  const { recruitmentId } = useRecruitment();

  if (isLoading && !candidate) {
    return <EvaluationSkeleton />;
  }

  if (error || !candidate) {
    return (
      <DataErrorState
        title="Candidato não encontrado"
        message={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const comments = commentsData ?? [];
  const recruiters = recruitersData ?? [];
  const answeredCount = applicationAnswerCount(candidate.application);

  const saveComment = async (content: Array<unknown>) => {
    const result = await saveApplicationComment(id, content);
    if (result.success) {
      mutate(applicationCommentsKey(id, recruitmentId));
    }
    return result;
  };

  const editComment = async (commentId: number, content: Array<any>) => {
    const ok = await editApplicationComment(id, commentId, content);
    if (ok) {
      mutate(applicationCommentsKey(id, recruitmentId));
    }
    return ok;
  };

  return (
    <EvaluationLayout
      header={
        <PageHeader
          backHref="/candidates"
          title={candidate.name}
          inlineOnMobile
          viewModeToggle={
            <CandidateHeaderActions
              candidateId={candidate.id}
              currentPage="candidate"
              dynamicId={candidate.dynamic?.dynamicId}
              hasInterview={Boolean(candidate.interview)}
            />
          }
          actions={<CandidateNavigation currentCandidateId={candidate.id} />}
        >
          <CandidateHeaderActions
            candidateId={candidate.id}
            currentPage="candidate"
            dynamicId={candidate.dynamic?.dynamicId}
            hasInterview={Boolean(candidate.interview)}
            mobile
          />
        </PageHeader>
      }
      sidebar={
        <CandidateModularInfo
          candidate={candidate}
          friends={candidate.knownRecruiters}
          authUser={user ? { id: user.id } : null}
          recruitmentId={recruitmentId}
          readOnlyDynamic={true}
          readOnlyInterview={true}
        />
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
                <CandidateCurriculum
                  application={candidate.application}
                  candidateId={candidate.id}
                />
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
                  saveToDatabase={saveComment}
                  onEditComment={editComment}
                  onVoteComment={voteApplicationComment.bind(
                    null,
                    candidate.id,
                  )}
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
