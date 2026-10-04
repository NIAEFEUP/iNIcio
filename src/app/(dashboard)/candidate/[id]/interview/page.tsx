"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { Lock, Unlock, Loader2 } from "lucide-react";

import CandidateCurriculum from "@/components/candidate/candidate-curriculum";
import { CandidateHeaderActions } from "@/components/candidate/candidate-header-actions";
import CandidateAnswers from "@/components/candidate/page/candidate-answers";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import { CandidateModularInfo } from "@/components/candidate/card";
import CommentFrame from "@/components/comments/comment-frame";
import { RealTimeEditor } from "@/components/editor/real-time-editor-dynamic-import";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  EvaluationLayout,
  EvaluationPanel,
} from "@/components/layout/evaluation-layout";
import { EvaluationTabs } from "@/components/layout/evaluation-tabs";
import { PageLoading } from "@/components/layout/page-loading";
import { DataErrorState } from "@/components/data-table/data-state-view";
import { RecruiterAssignedHeader } from "@/components/recruiter/recruiter-assigned-header";

import {
  classifyInterview,
  editInterviewComment,
  saveInterviewComment,
  setInterviewLocked,
  updateInterviewContent,
  voteInterviewComment,
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
  const [isLocking, setIsLocking] = useState(false);

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
    return <PageLoading />;
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
    const result = await saveInterviewComment(id, content);
    if (result.success) {
      mutate(interviewKey(id, recruitmentId, user?.id));
    }
    return result;
  };

  const editComment = async (commentId: number, content: Array<any>) => {
    const ok = await editInterviewComment(id, commentId, content);
    if (ok) {
      mutate(interviewKey(id, recruitmentId, user?.id));
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

  const handleToggleLock = async () => {
    if (!interview) return;
    setIsLocking(true);
    const newLocked = !interview.locked;
    try {
      await setInterviewLocked(id, newLocked);
      await mutate(
        interviewKey(id, recruitmentId, user?.id),
        (current: any) =>
          current
            ? {
                ...current,
                interview: {
                  ...current.interview,
                  locked: newLocked,
                },
              }
            : current,
        { revalidate: false },
      );
      toast.add({
        type: "success",
        title: newLocked
          ? "Entrevista bloqueada com sucesso"
          : "Entrevista desbloqueada com sucesso",
      });
    } catch (err) {
      console.error(err);
      toast.add({
        type: "error",
        title: "Erro ao alterar estado de bloqueio da entrevista",
      });
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <EvaluationLayout
      header={
        <PageHeader
          showSidebarTrigger={false}
          showBack={false}
          title={candidate.name}
          inlineOnMobile
          viewModeToggle={
            <CandidateHeaderActions
              candidateId={candidate.id}
              currentPage="interview"
              dynamicId={candidate.dynamic?.dynamicId}
            />
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <RecruiterAssignedHeader
                interviewers={interviewers}
                title="Entrevistadores"
              />
              <Button
                variant={interview.locked ? "secondary" : "outline"}
                disabled={isLocking}
                onClick={handleToggleLock}
                className={
                  interview.locked
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                    : ""
                }
              >
                {isLocking ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : interview.locked ? (
                  <Lock className="size-3.5" />
                ) : (
                  <Unlock className="size-3.5" />
                )}
                <span>{interview.locked ? "Bloqueada" : "Bloquear"}</span>
              </Button>
            </div>
          }
        >
          <CandidateHeaderActions
            candidateId={candidate.id}
            currentPage="interview"
            dynamicId={candidate.dynamic?.dynamicId}
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
          showResultVoting={false}
          showKnownCheckbox={false}
          onClassifyInterview={(value) =>
            handleClassifyInterview(candidate.id, value)
          }
          readOnlyDynamic={true}
        />
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
                  editable={!interview.locked}
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
                  type="interview"
                  comments={comments}
                  saveToDatabase={saveComment}
                  onEditComment={editComment}
                  onVoteComment={voteInterviewComment.bind(null, candidate.id)}
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
