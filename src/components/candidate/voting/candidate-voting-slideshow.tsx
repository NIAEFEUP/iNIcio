"use client";

import { useCallback, useState } from "react";
import { CandidateWithMetadata } from "@/lib/candidate";
import CandidateQuickInfo from "@/components/candidate/page/candidate-quick-info";
import CandidateVotingSlideshowArrows from "@/components/candidate/voting/candidate-voting-slideshow-arrows";
import CandidateVotingOptions from "./candidate-voting-options";
import { RecruiterVote, VotingPhase } from "@/lib/db";
import CandidateVotingStartButton from "./candidate-voting-start-button";
import { CandidateVotingProvider } from "@/lib/contexts/CandidateVotingContext";
import CandidateVotingStats from "./candidate-voting-stats";
import CandidateVotingShowResults from "./candidate-voting-show-results";
import CandidateVotingPhaseStatusList from "./candidate-voting-phase-status-list";
import { useVotingWebSocket } from "@/lib/hooks/use-voting-websocket";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface CandidateVotingSlideshowProps {
  candidates: Array<CandidateWithMetadata & { isFinished: boolean }>;
  admin: boolean;
  currentVotingPhase?: VotingPhase | null;
  submitVoteAction: (
    recruiterId: string,
    candidateId: string,
    decision: "approve" | "reject",
  ) => Promise<boolean>;
  changeCurrentVotingPhaseStatusCandidateAction: (
    votingPhaseId: number,
    candidateId: string,
  ) => Promise<boolean>;
  recruiterVotes: RecruiterVote[];
  resetCandidateVotes?: (
    votingPhaseId: number,
    candidateId: string,
  ) => Promise<void>;
  makeVoteDefinitiveAction: (
    decision: "accept" | "reject",
    votingPhaseId: number,
    candidateId: string,
  ) => Promise<boolean>;
  token: string;
  initialCandidateId: string | null;
  initialApprovedCount: number;
  initialRejectedCount: number;
  initialVotedCount: number;
  initialTotalToVote: number;
  initialFinishedCandidates: number;
}

export function CandidateVotingSlideshow({
  candidates,
  admin,
  currentVotingPhase = null,
  submitVoteAction,
  resetCandidateVotes,
  changeCurrentVotingPhaseStatusCandidateAction,
  recruiterVotes,
  makeVoteDefinitiveAction,
  token,
  initialCandidateId,
  initialApprovedCount,
  initialRejectedCount,
  initialVotedCount,
  initialTotalToVote,
  initialFinishedCandidates,
}: CandidateVotingSlideshowProps) {
  const initialIndex = Math.max(
    0,
    candidates.findIndex((c) => c.id === initialCandidateId),
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentCandidate = candidates[currentIndex];
  const [candidateFinished, setCandidateFinished] = useState(
    currentCandidate?.isFinished || false,
  );

  const handleStatusChanged = useCallback(
    (candidateId: string) => {
      const nextIndex = candidates.findIndex((c) => c.id === candidateId);
      if (nextIndex !== -1) {
        setCurrentIndex(nextIndex);
        setCandidateFinished(candidates[nextIndex]?.isFinished || false);
      }
    },
    [candidates],
  );

  const handleCandidateFinished = useCallback(
    (finishedCandidateId: string) => {
      if (currentCandidate?.id === finishedCandidateId) {
        setCandidateFinished(true);
      }
    },
    [currentCandidate?.id],
  );

  const {
    connected,
    connecting,
    error,
    approvedCount,
    rejectedCount,
    votedCount,
    totalToVote,
    finishedCandidates,
    reconnect,
  } = useVotingWebSocket({
    votingPhaseId: currentVotingPhase?.id ?? 0,
    token,
    initialCandidateId,
    initialApprovedCount,
    initialRejectedCount,
    initialVotedCount,
    initialTotalToVote,
    initialFinishedCandidates,
    onStatusChanged: handleStatusChanged,
    onCandidateFinished: handleCandidateFinished,
  });

  const [alreadyVotedForCurrentCandidate, setAlreadyVotedForCurrentCandidate] =
    useState<boolean>(false);

  const handleNext = () => {
    if (currentIndex < candidates.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  async function makeVoteDefinitive(decision: "accept" | "reject") {
    return await makeVoteDefinitiveAction(
      decision,
      currentVotingPhase?.id,
      currentCandidate?.id,
    );
  }

  const showConnectionBanner = !connected && !connecting;

  return (
    <CandidateVotingProvider
      candidates={candidates}
      admin={admin ? true : false}
      currentCandidateFinished={candidateFinished}
      setCurrentCandidateFinished={setCandidateFinished}
      currentVotingPhase={currentVotingPhase}
      submitVoteAction={submitVoteAction}
      alreadyVotedForCurrentCandidate={alreadyVotedForCurrentCandidate}
      setAlreadyVotedForCurrentCandidate={setAlreadyVotedForCurrentCandidate}
      changeCurrentVotingPhaseStatusCandidateAction={
        changeCurrentVotingPhaseStatusCandidateAction
      }
      recruiterVotes={recruiterVotes}
      currentCandidate={currentCandidate}
      setCurrentCandidate={() => {}}
      approvedCount={approvedCount}
      rejectedCount={rejectedCount}
      votedCount={votedCount}
    >
      {currentVotingPhase ? (
        <div className="flex flex-col bg-background">
          {showConnectionBanner && (
            <div className="border-b border-border bg-destructive/10 p-3">
              <div className="container mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    {error ?? "Ligação perdida com o servidor de votação."}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={reconnect}
                  className="gap-1"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reconectar
                </Button>
              </div>
            </div>
          )}

          {admin && (
            <header className="border-b border-border bg-card">
              <CandidateVotingStats
                currentCandidateVotes={votedCount}
                currentCandidateFinished={candidateFinished}
                setCurrentCandidateFinished={setCandidateFinished}
                votedCount={finishedCandidates}
                totalToVote={candidates.length}
                resetCandidateVotes={resetCandidateVotes}
                approvedCount={approvedCount}
                rejectedCount={rejectedCount}
                makeVoteDefinitive={makeVoteDefinitive}
              />
            </header>
          )}

          <div className="border-b border-border bg-card py-3">
            <div className="container mx-auto text-center text-sm text-muted-foreground">
              {votedCount} de {totalToVote} recrutadores votaram
            </div>
          </div>

          {!admin && <CandidateVotingOptions />}

          <div className="mt-8">
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {currentIndex + 1} / {candidates.length}
            </p>
          </div>

          {admin && (
            <section className="mt-4 flex items-center justify-center">
              <CandidateVotingShowResults />
            </section>
          )}

          <div className="flex flex-1 items-center justify-center px-4 py-12">
            <div className="w-full max-w-5xl">
              <div className="relative">
                <CandidateQuickInfo
                  showClassificationBadges={true}
                  candidate={currentCandidate}
                />

                {admin && (
                  <CandidateVotingSlideshowArrows
                    handlePrevious={handlePrevious}
                    currentIndex={currentIndex}
                    handleNext={handleNext}
                    finalIndex={candidates.length - 1}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <section className="flex flex-col gap-4 mx-auto items-center justify-center max-w-[40em] w-full">
          {admin && <CandidateVotingStartButton />}

          <CandidateVotingPhaseStatusList />
        </section>
      )}
    </CandidateVotingProvider>
  );
}
