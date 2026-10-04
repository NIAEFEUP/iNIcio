"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { Lock, Unlock, Loader2 } from "lucide-react";

import CandidateComments from "@/components/candidate/page/candidate-comments";
import { CandidateModularInfo } from "@/components/candidate/card";
import CommentFrame from "@/components/comments/comment-frame";
import { RealTimeEditor } from "@/components/editor/real-time-editor-dynamic-import";
import { Badge } from "@/components/ui/badge";
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
  classifyDynamic,
  editDynamicComment,
  saveDynamicComment,
  setDynamicLocked,
  updateDynamicContent,
  voteDynamicComment,
} from "@/app/candidate/actions";
import { useAuth } from "@/hooks/use-auth";
import { useRecruitment } from "@/lib/contexts/recruitment-context";
import {
  candidateKey,
  dynamicKey,
  useDynamicData,
} from "@/lib/hooks/candidates/use-candidate-data";

export default function DynamicPage() {
  const params = useParams<{ id: string }>();
  const dynamicId = Number(params.id);

  const { data, isLoading, error } = useDynamicData(dynamicId);
  const { user } = useAuth();
  const { mutate } = useSWRConfig();
  const { recruitmentId } = useRecruitment();
  const [isLocking, setIsLocking] = useState(false);

  const candidatesFromData = data?.dynamic.candidates;

  useEffect(() => {
    if (!candidatesFromData) return;
    for (const candidate of candidatesFromData) {
      mutate(candidateKey(candidate.id, recruitmentId), candidate, {
        revalidate: false,
      });
    }
  }, [candidatesFromData, recruitmentId, mutate]);

  if (isLoading && !data) {
    return <PageLoading />;
  }

  if (error || !data) {
    return (
      <DataErrorState
        title="Dinâmica não encontrada"
        message={error instanceof Error ? error.message : undefined}
      />
    );
  }

  const { dynamic, interviewers, comments, recruiters, token } = data;

  const saveContent = async (content: unknown) => {
    await updateDynamicContent(dynamicId, content);
  };

  const saveComment = async (content: Array<unknown>) => {
    const result = await saveDynamicComment(dynamicId, content);
    if (result.success) {
      mutate(dynamicKey(dynamicId, recruitmentId, user?.id));
    }
    return result;
  };

  const editComment = async (commentId: number, content: Array<any>) => {
    const ok = await editDynamicComment(dynamicId, commentId, content);
    if (ok) {
      mutate(dynamicKey(dynamicId, recruitmentId, user?.id));
    }
    return ok;
  };

  const handleClassifyDynamic = async (
    candidateId: string,
    classification: string,
  ) => {
    await classifyDynamic(candidateId, classification);
    mutate(
      candidateKey(candidateId, recruitmentId),
      (current: any) =>
        current
          ? { ...current, dynamicClassification: classification }
          : current,
      { revalidate: false },
    );
  };

  const handleToggleLock = async () => {
    if (!dynamic) return;
    setIsLocking(true);
    const newLocked = !dynamic.locked;
    try {
      await setDynamicLocked(dynamicId, newLocked);
      await mutate(
        dynamicKey(dynamicId, recruitmentId, user?.id),
        (current: any) =>
          current
            ? {
                ...current,
                dynamic: {
                  ...current.dynamic,
                  locked: newLocked,
                },
              }
            : current,
        { revalidate: false },
      );
      toast.add({
        type: "success",
        title: newLocked
          ? "Dinâmica bloqueada com sucesso"
          : "Dinâmica desbloqueada com sucesso",
      });
    } catch (err) {
      console.error(err);
      toast.add({
        type: "error",
        title: "Erro ao alterar estado de bloqueio da dinâmica",
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
          title={
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Dinâmica
              </h1>
              <Badge variant="secondary">
                {dynamic.candidates.length}{" "}
                {dynamic.candidates.length === 1 ? "candidato" : "candidatos"}
              </Badge>
            </div>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <RecruiterAssignedHeader
                interviewers={interviewers}
                title="Recrutadores"
              />
              <Button
                variant={dynamic.locked ? "secondary" : "outline"}
                disabled={isLocking}
                onClick={handleToggleLock}
                className={
                  dynamic.locked
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                    : ""
                }
              >
                {isLocking ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : dynamic.locked ? (
                  <Lock className="size-3.5" />
                ) : (
                  <Unlock className="size-3.5" />
                )}
                <span>{dynamic.locked ? "Bloqueada" : "Bloquear"}</span>
              </Button>
            </div>
          }
        />
      }
      sidebar={
        <div className="space-y-2">
          <div className="flex flex-col gap-4">
            {dynamic.candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-card border border-border p-3 rounded-2xl"
              >
                <CandidateModularInfo
                  candidate={candidate}
                  friends={candidate.knownRecruiters}
                  authUser={user ? { id: user.id } : null}
                  recruitmentId={recruitmentId}
                  showKnownCheckbox={false}
                  showContactInfo={false}
                  showLinks={false}
                  showDepartmentInterests={false}
                  showResultVoting={false}
                  onClassifyDynamic={(value) =>
                    handleClassifyDynamic(candidate.id, value)
                  }
                  readOnlyInterview={true}
                />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <EvaluationTabs
        defaultValue="dynamic"
        tabs={[
          {
            id: "dynamic",
            label: "Dinâmica",
            content: (
              <EvaluationPanel>
                <RealTimeEditor
                  token={token}
                  key={`dynamic-editor-${dynamicId}`}
                  roomId={`dynamic-${dynamicId}`}
                  docId={`dynamic-${dynamicId}`}
                  userName={user?.name ?? "Anonymous"}
                  saveHandler={saveContent}
                  entity={dynamic}
                  mentionItems={recruiters}
                  saveHandlerTimeout={250}
                  editable={!dynamic.locked}
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
                  candidate={dynamic.candidates}
                  type="dynamic"
                  comments={comments}
                  saveToDatabase={saveComment}
                  onEditComment={editComment}
                  onVoteComment={voteDynamicComment.bind(null, dynamic.id)}
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
