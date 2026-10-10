"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  SquareSquare,
  Users,
  UsersRound,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EvaluationLayout,
  EvaluationPanel,
} from "@/components/layout/evaluation-layout";
import { EvaluationTabs } from "@/components/layout/evaluation-tabs";
import { CandidateModularInfo } from "@/components/candidate/card";
import CandidateAnswers from "@/components/candidate/page/candidate-answers";
import CandidateCurriculum from "@/components/candidate/candidate-curriculum";
import CandidateComments from "@/components/candidate/page/candidate-comments";
import CommentFrame from "@/components/comments/comment-frame";
import {
  editApplicationComment,
  saveApplicationComment,
  terminateVotingSessionAction,
  voteApplicationComment,
} from "@/app/candidate/actions";
import { useVotingWebSocket } from "@/lib/hooks/use-voting-websocket";
import {
  applicationCommentsKey,
  useApplicationComments,
  useCandidateData,
  useRecruiters,
} from "@/lib/hooks/candidates/use-candidate-data";
import { useAuth } from "@/hooks/use-auth";
import { useRecruitment } from "@/lib/contexts/recruitment-context";
import { applicationAnswerCount } from "@/lib/candidate-answers";
import { CandidateInterviewModal } from "./candidate-interview-modal";
import { CandidateDynamicModal } from "./candidate-dynamic-modal";
import { CandidateVotesModal } from "./candidate-votes-modal";
import type { CandidateVotingMetadata } from "@/lib/candidate";
import type { Application, VotingPhase } from "@/lib/db";
import { toast } from "@/components/ui/toast";

interface AdminVotingViewProps {
  currentVotingPhase: VotingPhase & {
    candidates: Array<CandidateVotingMetadata>;
    status: {
      candidateId: string | null;
      accepted_candidates: number;
      rejected_candidates: number;
    };
  };
  changeCurrentVotingPhaseStatusCandidateAction: (
    votingPhaseId: number,
    candidateId: string,
  ) => Promise<boolean>;
  makeVoteDefinitiveAction: (
    decision: "accept" | "reject",
    votingPhaseId: number,
    candidateId: string,
  ) => Promise<boolean>;
  resetCandidateVotesAction: (
    votingPhaseId: number,
    candidateId: string,
  ) => Promise<void>;
  token: string;
  initialVoteCounts: {
    approvedCount: number;
    rejectedCount: number;
    votedCount: number;
  };
}

export function AdminVotingView({
  currentVotingPhase,
  changeCurrentVotingPhaseStatusCandidateAction,
  makeVoteDefinitiveAction,
  resetCandidateVotesAction,
  token,
  initialVoteCounts,
}: AdminVotingViewProps) {
  const router = useRouter();
  const candidates = currentVotingPhase.candidates;
  const { user } = useAuth();
  const { mutate } = useSWRConfig();
  const { recruitmentId } = useRecruitment();

  const initialIdx = Math.max(
    0,
    candidates.findIndex((c) => c.id === currentVotingPhase.status.candidateId),
  );

  const [currentIndex, setCurrentIndex] = useState(initialIdx);
  const [currentCandidate, setCurrentCandidate] =
    useState<CandidateVotingMetadata>(candidates[initialIdx] || candidates[0]);

  const live = useVotingWebSocket({
    votingPhaseId: currentVotingPhase.id,
    token,
    initial: {
      currentCandidateId: currentVotingPhase.status.candidateId,
      finishedCandidateIds: candidates
        .filter((c) => c.isFinished)
        .map((c) => c.id),
      acceptedCandidates: currentVotingPhase.status.accepted_candidates || 0,
      rejectedCandidates: currentVotingPhase.status.rejected_candidates || 0,
      terminated: Boolean(currentVotingPhase.terminated),
      approvedCount: initialVoteCounts.approvedCount,
      rejectedCount: initialVoteCounts.rejectedCount,
      votedCount: initialVoteCounts.votedCount,
    },
  });
  const finishedIds = new Set(live.finishedCandidateIds);

  const [votesModalOpen, setVotesModalOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [dynamicModalOpen, setDynamicModalOpen] = useState(false);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);

  const [isNavigating, startTransition] = useTransition();
  const [isMakingDefinitive, setIsMakingDefinitive] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  const { data: fullCandidateData } = useCandidateData(
    currentCandidate?.id || "",
  );

  const { data: commentsData } = useApplicationComments(
    currentCandidate?.id || "",
  );
  const { data: recruitersData } = useRecruiters();

  // Sync if status changes externally
  const phaseCandidateId = live.currentCandidateId ?? undefined;
  const [prevPhaseCandidateId, setPrevPhaseCandidateId] = useState<
    string | undefined
  >(phaseCandidateId);
  if (
    phaseCandidateId !== undefined &&
    prevPhaseCandidateId !== phaseCandidateId
  ) {
    setPrevPhaseCandidateId(phaseCandidateId);
    const newIdx = candidates.findIndex((c) => c.id === phaseCandidateId);
    if (newIdx !== -1) {
      setCurrentIndex(newIdx);
      setCurrentCandidate(candidates[newIdx]);
    }
  }

  const isCurrentCandidateFinished = finishedIds.has(currentCandidate?.id);

  const approvedVotesCount = live.approvedCount;
  const rejectedVotesCount = live.rejectedCount;
  const totalVotesCount = approvedVotesCount + rejectedVotesCount;

  const approvedPercent =
    totalVotesCount > 0
      ? Math.round((approvedVotesCount / totalVotesCount) * 100)
      : 0;
  const rejectedPercent =
    totalVotesCount > 0
      ? Math.round((rejectedVotesCount / totalVotesCount) * 100)
      : 0;

  const finishedCount = candidates.filter((c) => finishedIds.has(c.id)).length;

  const isSessionFinished =
    live.terminated ||
    (candidates.length > 0 && finishedCount === candidates.length);

  const handleSelectCandidate = async (newIdx: number) => {
    if (newIdx < 0 || newIdx >= candidates.length || isNavigating) return;
    const targetCandidate = candidates[newIdx];
    startTransition(async () => {
      setCurrentIndex(newIdx);
      setCurrentCandidate(targetCandidate);
      await changeCurrentVotingPhaseStatusCandidateAction(
        currentVotingPhase.id,
        targetCandidate.id,
      );
    });
  };

  const handleMakeDefinitive = async (decision: "accept" | "reject") => {
    if (!currentCandidate || isMakingDefinitive) return;
    setIsMakingDefinitive(true);
    try {
      const ok = await makeVoteDefinitiveAction(
        decision,
        currentVotingPhase.id,
        currentCandidate.id,
      );
      if (ok) {
        setVotesModalOpen(false);
        toast.add({
          type: "success",
          title:
            decision === "accept"
              ? "Candidato aceite em definitivo"
              : "Candidato rejeitado em definitivo",
        });

        // Automatically move to next unfinished candidate if available
        const nextUnfinishedIdx = candidates.findIndex(
          (c, idx) =>
            idx > currentIndex &&
            !finishedIds.has(c.id) &&
            c.id !== currentCandidate.id,
        );
        if (nextUnfinishedIdx !== -1) {
          setTimeout(() => {
            handleSelectCandidate(nextUnfinishedIdx);
          }, 300);
        }
      } else {
        toast.add({
          type: "error",
          title: "Erro ao registar decisão definitiva",
        });
      }
    } catch (err) {
      console.error(err);
      toast.add({
        type: "error",
        title: "Erro ao registar decisão",
      });
    } finally {
      setIsMakingDefinitive(false);
    }
  };

  const handleResetVotes = async () => {
    if (!currentCandidate || isResetting) return;
    setIsResetting(true);
    try {
      await resetCandidateVotesAction(
        currentVotingPhase.id,
        currentCandidate.id,
      );
      toast.add({
        type: "success",
        title: "Votos do candidato reiniciados com sucesso",
      });
    } catch (err) {
      console.error(err);
      toast.add({
        type: "error",
        title: "Erro ao reiniciar votos",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleTerminateSession = async () => {
    if (isTerminating) return;
    setIsTerminating(true);
    try {
      const res = await terminateVotingSessionAction(currentVotingPhase.id);
      if (res.success) {
        toast.add({
          type: "success",
          title: "Sessão de votação terminada com sucesso",
        });
        router.push("/candidates/voting");
      } else {
        toast.add({
          type: "error",
          title: res.error || "Erro ao terminar sessão",
        });
      }
    } catch (err) {
      console.error(err);
      toast.add({
        type: "error",
        title: "Erro ao terminar sessão",
      });
    } finally {
      setIsTerminating(false);
    }
  };

  const saveComment = async (content: Array<unknown>) => {
    if (!currentCandidate) return { success: false };
    const result = await saveApplicationComment(currentCandidate.id, content);
    if (result.success) {
      mutate(
        applicationCommentsKey(currentCandidate.id, recruitmentId, user?.id),
      );
    }
    return result;
  };

  const editComment = async (commentId: number, content: Array<any>) => {
    if (!currentCandidate) return false;
    const ok = await editApplicationComment(
      currentCandidate.id,
      commentId,
      content,
    );
    if (ok) {
      mutate(
        applicationCommentsKey(currentCandidate.id, recruitmentId, user?.id),
      );
    }
    return ok;
  };

  if (!currentCandidate) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Nenhum candidato na sessão de votação.
      </div>
    );
  }

  const effectiveCandidate = fullCandidateData || currentCandidate;
  const hasInterview = Boolean(currentCandidate.interview);
  const dynamicId = currentCandidate.dynamic?.dynamicId || null;
  const hasDynamic = Boolean(dynamicId);

  const application = effectiveCandidate.application as Application | null;
  const answeredCount = applicationAnswerCount(application);
  const comments = commentsData ?? [];
  const recruiters = recruitersData ?? [];

  return (
    <>
      <EvaluationLayout
        header={
          <PageHeader
            showBack={true}
            backHref="/candidates/voting"
            backLabel="Votações"
            title={currentCandidate.name || "Candidato"}
            inlineOnMobile
            viewModeToggle={
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleSelectCandidate(currentIndex - 1)}
                  disabled={currentIndex === 0 || isNavigating}
                  title="Candidato anterior"
                  aria-label="Candidato anterior"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs font-medium text-muted-foreground px-1.5 whitespace-nowrap">
                  {currentIndex + 1} de {candidates.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleSelectCandidate(currentIndex + 1)}
                  disabled={
                    currentIndex === candidates.length - 1 || isNavigating
                  }
                  title="Próximo candidato"
                  aria-label="Próximo candidato"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            }
            actions={
              <div className="flex items-center gap-2.5 flex-wrap justify-end">
                {!live.connected && (
                  <span className="text-xs text-muted-foreground">
                    A ligar ao servidor de votação…
                  </span>
                )}

                {/* Overall Session Stats in Header */}
                <div className="flex items-center gap-2 text-xs rounded-lg border border-border/70 bg-card px-3 py-1.5 shadow-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Progresso:</span>
                    <span className="font-semibold text-foreground">
                      {finishedCount}/{candidates.length}
                    </span>
                  </div>
                  <span className="text-muted-foreground/60">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {live.acceptedCandidates} aceites
                  </span>
                  <span className="text-muted-foreground/60">·</span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold">
                    {live.rejectedCandidates} rejeitados
                  </span>
                </div>

                {/* Open the candidate's full detail page in a new tab */}
                <Link
                  href={`/candidate/${currentCandidate.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`${buttonVariants({ variant: "outline", size: "sm" })} h-8 gap-1.5 text-xs`}
                >
                  <ExternalLink className="size-3.5" />
                  <span>Ver página</span>
                </Link>

                {/* Option to See Votes (Opens Modal) */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setVotesModalOpen(true)}
                  className="h-8 gap-2 text-xs font-semibold shadow-xs"
                >
                  <Users className="size-3.5" />
                  <span>Votos ({totalVotesCount})</span>
                </Button>

                {/* Terminate Voting Phase (only shown if session is not yet terminated/finished) */}
                {!isSessionFinished && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTerminateDialogOpen(true)}
                    className="h-8 gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50"
                  >
                    <SquareSquare className="size-3.5" />
                    <span>Terminar votação</span>
                  </Button>
                )}
              </div>
            }
          />
        }
        sidebar={
          <div className="flex flex-col gap-5">
            {/* Candidate Modular Info (100% Read-only during voting) */}
            <CandidateModularInfo
              candidate={effectiveCandidate}
              friends={currentCandidate.knownRecruiters}
              authUser={user ? { id: user.id, isAdmin: user.isAdmin } : null}
              recruitmentId={recruitmentId}
              readOnly={true}
              readOnlyInterview={true}
              readOnlyDynamic={true}
              showKnownCheckbox={false}
              showResultVoting={false}
            />

            {/* Guias de Avaliação Card (below classifications, same card style) */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                <span>Guias de Avaliação</span>
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground font-medium">
                    Entrevista
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-28 text-xs font-medium gap-1.5"
                    disabled={!hasInterview}
                    onClick={() => setInterviewModalOpen(true)}
                  >
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span>Ver guião</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground font-medium">
                    Dinâmica
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-28 text-xs font-medium gap-1.5"
                    disabled={!hasDynamic}
                    onClick={() => setDynamicModalOpen(true)}
                  >
                    <UsersRound className="size-3.5 text-muted-foreground" />
                    <span>Ver guião</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4 w-full h-full">
          {/* Main Candidate Information Tabs: Answers, Curriculum, Comments */}
          <EvaluationTabs
            defaultValue="answers"
            tabs={[
              {
                id: "answers",
                label: "Respostas",
                count: answeredCount,
                content: (
                  <CandidateAnswers
                    key={currentCandidate.id}
                    application={application}
                  />
                ),
              },
              {
                id: "curriculum",
                label: "Currículo",
                hidden: !application?.curriculum,
                content: (
                  <EvaluationPanel>
                    {application && (
                      <CandidateCurriculum
                        application={application}
                        candidateId={currentCandidate.id}
                      />
                    )}
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
                      candidate={effectiveCandidate as any}
                      type="application"
                      comments={comments}
                      saveToDatabase={saveComment}
                      onEditComment={editComment}
                      onVoteComment={voteApplicationComment.bind(
                        null,
                        currentCandidate.id,
                      )}
                      recruiters={recruiters}
                    />
                  </CommentFrame>
                ),
              },
            ]}
          />
        </div>
      </EvaluationLayout>

      {/* Votes & Decision Modal */}
      <CandidateVotesModal
        candidateName={currentCandidate.name || "Candidato"}
        totalVotesCount={totalVotesCount}
        approvedVotesCount={approvedVotesCount}
        rejectedVotesCount={rejectedVotesCount}
        approvedPercent={approvedPercent}
        rejectedPercent={rejectedPercent}
        isFinished={isCurrentCandidateFinished}
        isMakingDefinitive={isMakingDefinitive}
        isResetting={isResetting}
        open={votesModalOpen}
        onOpenChange={setVotesModalOpen}
        onMakeDefinitive={handleMakeDefinitive}
        onResetVotes={handleResetVotes}
      />

      {/* Modals for Interview & Dynamic (pure editor blocks) */}
      <CandidateInterviewModal
        candidateId={currentCandidate.id}
        open={interviewModalOpen}
        onOpenChange={setInterviewModalOpen}
      />

      <CandidateDynamicModal
        dynamicId={dynamicId}
        open={dynamicModalOpen}
        onOpenChange={setDynamicModalOpen}
      />

      {/* Confirmation Modal to Terminate Voting Session */}
      <Dialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Terminar sessão de votação?</DialogTitle>
            <DialogDescription>
              Esta ação irá encerrar a sessão de votação #
              {currentVotingPhase.id}. Os recrutadores deixarão de poder votar
              nesta sessão e os candidatos pendentes permanecerão por decidir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTerminateDialogOpen(false)}
              disabled={isTerminating}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleTerminateSession}
              disabled={isTerminating}
              className="gap-1.5"
            >
              {isTerminating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <SquareSquare className="size-3.5" />
              )}
              <span>Confirmar e Terminar</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
