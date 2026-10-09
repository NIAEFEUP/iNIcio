"use client";

import { useState } from "react";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { CandidateAvatarLightbox } from "@/components/candidates/candidate-avatar-lightbox";
import { CandidateInterviewModal } from "./candidate-interview-modal";
import { CandidateDynamicModal } from "./candidate-dynamic-modal";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { getInitials } from "@/lib/utils";
import { ClassificationText } from "@/components/candidates/candidate-text";
import { useVotingWebSocket } from "@/lib/hooks/use-voting-websocket";
import type { CandidateVotingMetadata } from "@/lib/candidate";
import type { RecruiterVote, VotingPhase } from "@/lib/db";
import { toast } from "@/components/ui/toast";

interface RecruiterVotingViewProps {
  currentVotingPhase: VotingPhase & {
    candidates: Array<CandidateVotingMetadata>;
    status: {
      candidateId: string | null;
      accepted_candidates: number;
      rejected_candidates: number;
    };
  };
  recruiterVotes: RecruiterVote[];
  submitVoteAction: (
    recruiterId: string,
    candidateId: string,
    decision: "approve" | "reject",
  ) => Promise<boolean>;
  currentUserId: string;
  token: string;
  showBack?: boolean;
}

export function RecruiterVotingView({
  currentVotingPhase,
  recruiterVotes: initialRecruiterVotes,
  submitVoteAction,
  currentUserId,
  token,
  showBack = false,
}: RecruiterVotingViewProps) {
  const candidates = currentVotingPhase.candidates;

  const initialIdx = Math.max(
    0,
    candidates.findIndex((c) => c.id === currentVotingPhase.status.candidateId),
  );

  const [currentCandidate, setCurrentCandidate] =
    useState<CandidateVotingMetadata>(candidates[initialIdx] || candidates[0]);

  const [votedCandidateIds, setVotedCandidateIds] = useState<Set<string>>(
    () => new Set(initialRecruiterVotes.map((v) => v.candidateId)),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [dynamicModalOpen, setDynamicModalOpen] = useState(false);

  const [candidatesFinishedMap, setCandidatesFinishedMap] = useState<
    Record<string, boolean>
  >(() => {
    const map: Record<string, boolean> = {};
    for (const c of candidates) {
      map[c.id] = c.isFinished || false;
    }
    return map;
  });

  const ws = useVotingWebSocket({
    votingPhaseId: currentVotingPhase.id,
    token,
    initialCandidateId: currentCandidate?.id || null,
    initialFinishedCandidates: candidates.filter((c) => c.isFinished).length,
    initialAcceptedCandidates:
      currentVotingPhase.status.accepted_candidates || 0,
    initialRejectedCandidates:
      currentVotingPhase.status.rejected_candidates || 0,
    initialTerminated: Boolean(currentVotingPhase.terminated),
    onStatusChanged: (newCandidateId) => {
      const newCandidate = candidates.find((c) => c.id === newCandidateId);
      if (newCandidate) {
        setCurrentCandidate(newCandidate);
      }
    },
    onCandidateFinished: (finishedCandidateId) => {
      setCandidatesFinishedMap((prev) => ({
        ...prev,
        [finishedCandidateId]: true,
      }));
    },
    onVotesReset: (resetCandidateId) => {
      setCandidatesFinishedMap((prev) => ({
        ...prev,
        [resetCandidateId]: false,
      }));
      setVotedCandidateIds((prev) => {
        const next = new Set(prev);
        next.delete(resetCandidateId);
        return next;
      });
    },
  });

  const isPhaseTerminated =
    ws.isTerminated || Boolean(currentVotingPhase.terminated);

  const hasVotedForCurrent = votedCandidateIds.has(currentCandidate?.id);
  const isCandidateFinished =
    candidatesFinishedMap[currentCandidate?.id] || false;

  const acceptedCount = ws.acceptedCandidates;
  const rejectedCount = ws.rejectedCandidates;
  const finishedCount = ws.finishedCandidates;

  const handleVote = async (decision: "approve" | "reject") => {
    if (
      !currentCandidate ||
      isSubmitting ||
      hasVotedForCurrent ||
      isPhaseTerminated
    )
      return;

    setIsSubmitting(true);
    try {
      const ok = await submitVoteAction(
        currentUserId,
        currentCandidate.id,
        decision,
      );

      if (ok) {
        setVotedCandidateIds((prev) => new Set([...prev, currentCandidate.id]));
        toast.add({
          type: "success",
          title: "Voto submetido com sucesso!",
        });
      } else {
        toast.add({
          type: "error",
          title: "Não foi possível registar o voto.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.add({
        type: "error",
        title: "Erro ao submeter voto",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentCandidate) {
    return (
      <div className="flex flex-col flex-1 min-h-[calc(100vh-8rem)]">
        <PageHeader
          title="Votação"
          showBack={showBack}
          backHref="/candidates/voting"
          inlineOnMobile
        />
        <div className="flex flex-col items-center justify-center flex-1 py-20 px-4 text-center">
          <p className="text-muted-foreground text-sm">
            A aguardar pelo início da sessão de votação...
          </p>
        </div>
      </div>
    );
  }

  const degree = currentCandidate.application?.degree;
  const curricularYear = currentCandidate.application?.curricularYear;

  const hasInterview = Boolean(currentCandidate.interview);
  const dynamicId = currentCandidate.dynamic?.dynamicId || null;
  const hasDynamic = Boolean(dynamicId);

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100vh-8rem)]">
      {/* Session Progress in Header matching Admin Layout */}
      <PageHeader
        title="Votação"
        showBack={showBack}
        backHref="/candidates/voting"
        inlineOnMobile
        actions={
          <div className="flex items-center gap-2 text-xs rounded-lg border border-border/70 bg-card px-3 py-1.5 shadow-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Progresso:</span>
              <span className="font-semibold text-foreground">
                {finishedCount}/{candidates.length}
              </span>
            </div>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {acceptedCount} aceites
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              {rejectedCount} rejeitados
            </span>
          </div>
        }
      />

      {/* Main Content Area: Centered vertically, desktop side-by-side, mobile stacked */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 w-full items-stretch">
          {/* Left Column: Candidate Information */}
          <div className="flex flex-col gap-4 justify-center">
            {/* Avatar & Name */}
            <div className="flex flex-col items-center text-center gap-3">
              <CandidateAvatarLightbox
                name={currentCandidate.name || "Candidato"}
                picture={getStableImageUrl(currentCandidate.image)}
                initials={getInitials(currentCandidate.name)}
                size="xl"
                className="size-28 sm:size-32 shadow-sm"
                avatarClassName="size-28 sm:size-32"
              />
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {currentCandidate.name || "Sem nome"}
              </h2>
            </div>

            {/* Academic Information Card */}
            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">
                    Curso
                  </span>
                  <span className="text-sm font-semibold text-foreground uppercase">
                    {degree || "—"}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-medium text-muted-foreground">
                    Ano Curricular
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {curricularYear ? `${curricularYear}º` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Two Classification Cards with Guião open buttons */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="rounded-xl border border-border/70 bg-card p-3.5 text-center shadow-xs flex flex-col items-center justify-center gap-1.5">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Entrevista
                  </span>
                  {hasInterview && (
                    <button
                      type="button"
                      onClick={() => setInterviewModalOpen(true)}
                      className="text-muted-foreground/60 hover:text-foreground transition-colors p-0.5 rounded-sm hover:bg-muted inline-flex items-center justify-center cursor-pointer"
                      title="Ver guião de entrevista"
                      aria-label="Ver guião de entrevista"
                    >
                      <ExternalLink className="size-3" />
                    </button>
                  )}
                </div>
                <ClassificationText
                  level={currentCandidate.interviewClassification}
                  className="text-sm sm:text-base font-semibold"
                />
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-3.5 text-center shadow-xs flex flex-col items-center justify-center gap-1.5">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Dinâmica
                  </span>
                  {hasDynamic && (
                    <button
                      type="button"
                      onClick={() => setDynamicModalOpen(true)}
                      className="text-muted-foreground/60 hover:text-foreground transition-colors p-0.5 rounded-sm hover:bg-muted inline-flex items-center justify-center cursor-pointer"
                      title="Ver guião de dinâmica"
                      aria-label="Ver guião de dinâmica"
                    >
                      <ExternalLink className="size-3" />
                    </button>
                  )}
                </div>
                <ClassificationText
                  level={currentCandidate.dynamicClassification}
                  className="text-sm sm:text-base font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="flex flex-col justify-center w-full">
            {isPhaseTerminated ? (
              <div className="rounded-2xl border border-border/70 bg-card p-8 flex flex-col items-center justify-center text-center space-y-2 h-full min-h-[220px] shadow-xs">
                <div className="text-base font-semibold text-foreground">
                  Sessão de votação terminada
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta sessão de votação foi encerrada pela administração.
                </p>
              </div>
            ) : isCandidateFinished ? (
              <div className="rounded-2xl border border-border/70 bg-card p-8 flex flex-col items-center justify-center text-center space-y-2 h-full min-h-[220px] shadow-xs">
                <div className="text-base font-semibold text-foreground">
                  Votação concluída
                </div>
                <p className="text-xs text-muted-foreground">
                  A votação deste candidato foi finalizada pelo administrador. A
                  aguardar pelo próximo candidato...
                </p>
              </div>
            ) : hasVotedForCurrent ? (
              <div className="rounded-2xl border border-border/70 bg-card p-8 flex flex-col items-center justify-center text-center space-y-1.5 h-full min-h-[220px] shadow-xs">
                <div className="text-base font-semibold text-foreground">
                  Voto registado
                </div>
                <p className="text-xs text-muted-foreground max-w-xs">
                  A aguardar pela decisão final ou pela transição para o próximo
                  candidato...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-1 md:flex md:flex-col gap-4 h-full">
                {/* ACEITAR Button */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleVote("approve")}
                  disabled={isSubmitting}
                  className="h-28 sm:h-32 md:h-auto md:flex-1 w-full flex flex-col md:flex-row lg:flex-col items-center justify-center gap-2.5 text-2xl sm:text-3xl font-bold bg-card hover:bg-emerald-500/10 hover:border-emerald-500/30 text-foreground border-2 border-border/80 active:scale-[0.98] rounded-2xl shadow-xs transition-all duration-150 py-6"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-8 animate-spin" />
                  ) : (
                    <>
                      <Check className="size-8 sm:size-10 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
                      <span>Aceitar</span>
                    </>
                  )}
                </Button>

                {/* REJEITAR Button */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleVote("reject")}
                  disabled={isSubmitting}
                  className="h-28 sm:h-32 md:h-auto md:flex-1 w-full flex flex-col md:flex-row lg:flex-col items-center justify-center gap-2.5 text-2xl sm:text-3xl font-bold bg-card hover:bg-rose-500/10 hover:border-rose-500/30 text-foreground border-2 border-border/80 active:scale-[0.98] rounded-2xl shadow-xs transition-all duration-150 py-6"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-8 animate-spin" />
                  ) : (
                    <>
                      <X className="size-8 sm:size-10 stroke-[2.5] text-rose-600 dark:text-rose-400" />
                      <span>Rejeitar</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals for Interview & Dynamic */}
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
    </div>
  );
}
