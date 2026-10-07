"use client";

import { useState } from "react";
import { Check, CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CandidateAvatarLightbox } from "@/components/candidates/candidate-avatar-lightbox";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { getInitials } from "@/lib/utils";
import { ClassificationText } from "@/components/candidates/candidate-text";
import { useCurrentVotingPhaseStatus } from "@/lib/hooks/voting/use-current-voting-phase-status";
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
}

export function RecruiterVotingView({
  currentVotingPhase,
  recruiterVotes: initialRecruiterVotes,
  submitVoteAction,
  currentUserId,
}: RecruiterVotingViewProps) {
  const candidates = currentVotingPhase.candidates;

  const initialIdx = Math.max(
    0,
    candidates.findIndex((c) => c.id === currentVotingPhase.status.candidateId),
  );

  const [currentIndex, setCurrentIndex] = useState(initialIdx);
  const [currentCandidate, setCurrentCandidate] =
    useState<CandidateVotingMetadata>(candidates[initialIdx] || candidates[0]);

  const [votedCandidateIds, setVotedCandidateIds] = useState<Set<string>>(
    () => new Set(initialRecruiterVotes.map((v) => v.candidateId)),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Poll status from server to sync with admin in real time
  const { votingPhaseStatus } = useCurrentVotingPhaseStatus(
    currentVotingPhase.id,
  );

  const activeCandidateId = votingPhaseStatus?.candidateId;
  const [prevActiveCandidateId, setPrevActiveCandidateId] = useState<
    string | undefined
  >(activeCandidateId);
  if (
    activeCandidateId !== undefined &&
    prevActiveCandidateId !== activeCandidateId
  ) {
    setPrevActiveCandidateId(activeCandidateId);
    const newIdx = candidates.findIndex((c) => c.id === activeCandidateId);
    if (newIdx !== -1) {
      setCurrentIndex(newIdx);
      setCurrentCandidate(candidates[newIdx]);
    }
  }

  const hasVotedForCurrent = votedCandidateIds.has(currentCandidate?.id);
  const isCandidateFinished = currentCandidate?.isFinished || false;

  const handleVote = async (decision: "approve" | "reject") => {
    if (!currentCandidate || isSubmitting || hasVotedForCurrent) return;

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
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <p className="text-muted-foreground text-sm">
          A aguardar pelo início da sessão de votação...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full px-2 sm:px-4 py-2 sm:py-6 gap-5">
      {/* Top Header / Progress Info */}
      <div className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          Votação em direto
        </span>
        <span>
          Candidato {currentIndex + 1} de {candidates.length}
        </span>
      </div>

      {/* Main Candidate Overview Card */}
      <div className="w-full rounded-2xl border border-border/80 bg-card p-6 shadow-xs flex flex-col items-center text-center gap-4">
        {/* Candidate Avatar */}
        <CandidateAvatarLightbox
          name={currentCandidate.name || "Candidato"}
          picture={getStableImageUrl(currentCandidate.image)}
          initials={getInitials(currentCandidate.name)}
          size="xl"
        />

        {/* Candidate Identity */}
        <div className="space-y-1 w-full">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {currentCandidate.name || "Sem nome"}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-x-2 text-xs sm:text-sm text-muted-foreground">
            {currentCandidate.application?.degree && (
              <span className="uppercase font-medium text-foreground">
                {currentCandidate.application.degree}
              </span>
            )}
            {currentCandidate.application?.curricularYear && (
              <>
                <span>·</span>
                <span>{currentCandidate.application.curricularYear}º ano</span>
              </>
            )}
            {currentCandidate.application?.studentNumber && (
              <>
                <span>·</span>
                <span>{currentCandidate.application.studentNumber}</span>
              </>
            )}
          </div>
        </div>

        {/* Classifications - Clean typography */}
        <div className="grid grid-cols-2 gap-3 w-full pt-1">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Entrevista
            </span>
            <ClassificationText
              level={currentCandidate.interviewClassification}
              className="text-sm font-semibold"
            />
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-center space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Dinâmica
            </span>
            <ClassificationText
              level={currentCandidate.dynamicClassification}
              className="text-sm font-semibold"
            />
          </div>
        </div>

        {currentCandidate.application?.interests &&
          currentCandidate.application.interests.length > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              <span className="font-medium text-foreground">Interesses:</span>{" "}
              {currentCandidate.application.interests.join(", ")}
            </p>
          )}
      </div>

      {/* Primary Actions Area */}
      <div className="w-full">
        {isCandidateFinished ? (
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-8 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary font-semibold text-sm">
              <Sparkles className="size-4" />
              <span>Votação concluída</span>
            </div>
            <p className="text-xs text-muted-foreground">
              A votação deste candidato foi finalizada pelo administrador. A
              aguardar pelo próximo candidato...
            </p>
          </div>
        ) : hasVotedForCurrent ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-2 animate-in fade-in-0 duration-200">
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
              <CheckCircle2 className="size-6" />
              <span>Voto registado!</span>
            </div>
            <p className="text-xs text-muted-foreground">
              A aguardar pela decisão final ou pela transição para o próximo
              candidato...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full pt-1">
            {/* SIM Button - Extra Large */}
            <Button
              size="lg"
              onClick={() => handleVote("approve")}
              disabled={isSubmitting}
              className="h-28 sm:h-36 flex flex-col items-center justify-center gap-2 text-2xl sm:text-3xl font-extrabold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl shadow-md transition-all duration-150"
            >
              {isSubmitting ? (
                <Loader2 className="size-8 animate-spin" />
              ) : (
                <>
                  <Check className="size-8 sm:size-10 stroke-[3]" />
                  <span>Sim</span>
                </>
              )}
            </Button>

            {/* NÃO Button - Extra Large */}
            <Button
              size="lg"
              variant="destructive"
              onClick={() => handleVote("reject")}
              disabled={isSubmitting}
              className="h-28 sm:h-36 flex flex-col items-center justify-center gap-2 text-2xl sm:text-3xl font-extrabold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-2xl shadow-md transition-all duration-150"
            >
              {isSubmitting ? (
                <Loader2 className="size-8 animate-spin" />
              ) : (
                <>
                  <X className="size-8 sm:size-10 stroke-[3]" />
                  <span>Não</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
