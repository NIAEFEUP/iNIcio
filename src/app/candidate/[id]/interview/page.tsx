"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useSWRConfig } from "swr";

import CandidateCurriculum from "@/components/candidate/candidate-curriculum";
import { CandidateHeaderActions } from "@/components/candidate/candidate-header-actions";
import CandidateAnswers from "@/components/candidate/page/candidate-answers";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import CandidateGridCard from "@/components/candidates/candidate-grid-card";
import CandidateVotingStatus from "@/components/candidate/candidate-voting-status";
import CommentFrame from "@/components/comments/comment-frame";
import { RealTimeEditor } from "@/components/editor/real-time-editor-dynamic-import";
import { PageHeader } from "@/components/layout/page-header";
import {
  EvaluationLayout,
  EvaluationPanel,
} from "@/components/layout/evaluation-layout";
import { EvaluationTabs } from "@/components/layout/evaluation-tabs";
import { EvaluationSkeleton } from "@/components/layout/evaluation-skeleton";
import { DataErrorState } from "@/components/data-table/data-state-view";
import RecruiterAssignedInfo from "@/components/recruiter/recruiter-assigned-info";

import {
  classifyInterview,
  saveInterviewComment,
  updateInterviewContent,
} from "@/app/candidate/actions";
import { applicationAnswerCount } from "@/lib/candidate-answers";
import { useAuth } from "@/hooks/use-auth";
import { useRecruitment } from "@/lib/contexts/recruitment-context";
import {
  candidateKey,
  interviewKey,
  useInterviewData,
} from "@/lib/hooks/candidates/use-candidate-data";

export default function InterviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isLoading, error } = useInterviewData(id);
  const { user } = useAuth();
  const { mutate } = useSWRConfig();
  const { recruitmentId } = useRecruitment();

  const candidateFromData = data?.candidate;

  useEffect(() => {
    if (!candidateFromData) return;
    mutate(
      candidateKey(candidateFromData.id, recruitmentId),
      candidateFromData,
      { revalidate: false },
    );
  }, [candidateFromData, recruitmentId, mutate]);

  if (isLoading && !data) {
    return <EvaluationSkeleton showInterviewers />;
  }

  if (error || !data) {
    return (
      <DataErrorState
        title="Entrevista não encontrada"
        message={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const { candidate, interview, interviewers, comments, recruiters, token } =
    data;
  const answeredCount = applicationAnswerCount(candidate.application);

  const saveContent = async (content: unknown) => {
    await updateInterviewContent(id, content);
  };

  const saveComment = async (content: Array<unknown>) => {
    const ok = await saveInterviewComment(id, content);
    if (ok) {
      mutate(interviewKey(id, recruitmentId));
    }
    return ok;
  };

  const handleClassifyInterview = async (
    candidateId: string,
    classification: string,
  ) => {
    await classifyInterview(candidateId, classification);
    mutate(
      candidateKey(candidateId, recruitmentId),
      (current: any) =>
        current
          ? { ...current, interviewClassification: classification }
          : current,
      { revalidate: false },
    );
  };

  return (
    <EvaluationLayout
      header={
        <PageHeader
          backHref={`/candidate/${id}`}
          title={candidate.name}
          actions={
            <CandidateHeaderActions
              candidateId={candidate.id}
              currentPage="interview"
              dynamicId={candidate.dynamic?.dynamicId}
            />
          }
        />
      }
      sidebar={
        <>
          <CandidateGridCard
            candidate={candidate}
            friends={candidate.knownRecruiters}
            authUser={user ? { id: user.id } : null}
            classifyInterview={handleClassifyInterview}
            showContactInfo
          />
          <RecruiterAssignedInfo interviewers={interviewers} />
          {candidate.votingDecision && (
            <CandidateVotingStatus votingDecision={candidate.votingDecision} />
          )}
        </>
      }
    >
      <EvaluationTabs
        defaultValue="interview"
        tabs={[
          {
            id: "interview",
            label: "Entrevista",
            content: (
              <EvaluationPanel>
                <RealTimeEditor
                  token={token}
                  key={`interview-editor-${id}`}
                  roomId={`interview-${id}`}
                  docId={`interview-${id}`}
                  userName={user?.name ?? "Anonymous"}
                  saveHandler={saveContent}
                  entity={interview}
                  mentionItems={recruiters}
                  saveHandlerTimeout={250}
                />
              </EvaluationPanel>
            ),
          },
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
                  type="interview"
                  comments={comments}
                  saveToDatabase={saveComment}
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
