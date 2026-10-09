"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { Lock, Unlock, Loader2 } from "lucide-react";

import CandidateComments from "@/components/candidate/page/candidate-comments";
import { DynamicCandidateCard } from "@/components/candidate/card";
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

  const canEditDynamic =
    Boolean(data.isAuthenticatedAdmin) ||
    Boolean(user?.isAdmin) ||
    interviewers.some((i) => i.id === user?.id);

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
    const nextClassification =
      classification === "none" ? null : classification;

    await classifyDynamic(candidateId, classification);

    mutate(
      candidateKey(candidateId, recruitmentId),
      (current: any) =>
        current
          ? { ...current, dynamicClassification: nextClassification }
          : current,
      { revalidate: false },
    );

    mutate(
      dynamicKey(dynamicId, recruitmentId, user?.id),
      (current: any) => {
        if (!current?.dynamic?.candidates) return current;
        return {
          ...current,
          dynamic: {
            ...current.dynamic,
            candidates: current.dynamic.candidates.map((c: any) =>
              c.id === candidateId
                ? {
                    ...c,
                    dynamicClassification:
                      classification === "none" ? "none" : classification,
                  }
                : c,
            ),
          },
        };
      },
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
      className="h-full flex-1 min-h-0"
      sidebarClassName="space-y-0 lg:h-full lg:flex lg:flex-col min-h-0"
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
        <div className="flex flex-col gap-2.5 h-full min-h-0 flex-1">
          <div className="flex items-center justify-between px-1 h-9 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Candidatos
              </span>
              <Badge
                variant="outline"
                className="h-5 px-1.5 py-0 text-[11px] font-medium border-border/60"
              >
                {dynamic.candidates.length}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {
                dynamic.candidates.filter(
                  (c) =>
                    c.dynamicClassification &&
                    c.dynamicClassification !== "none",
                ).length
              }
              /{dynamic.candidates.length} classificados
            </span>
          </div>

          <div className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-y-auto pr-0.5">
            {dynamic.candidates.map((candidate) => (
              <DynamicCandidateCard
                key={candidate.id}
                candidate={candidate}
                candidateCount={dynamic.candidates.length}
                readOnly={!canEditDynamic}
                onClassifyDynamic={(value) =>
                  handleClassifyDynamic(candidate.id, value)
                }
              />
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
