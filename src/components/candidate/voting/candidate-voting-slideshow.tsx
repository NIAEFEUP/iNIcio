"use client";

import { useState, useEffect } from "react";
import { CandidateWithMetadata } from "@/lib/candidate";
import CandidateQuickInfo from "@/components/candidate/page/candidate-quick-info";
import CandidateVotingSlideshowArrows from "@/components/candidate/voting/candidate-voting-slideshow-arrows";
import CandidateVotingOptions from "./candidate-voting-options";
import { RecruiterVote, VotingPhase } from "@/lib/db";
import CandidateVotingStartButton from "./candidate-voting-start-button";
import { CandidateVotingProvider } from "@/lib/contexts/CandidateVotingContext";
import CandidateVotingStats from "./candidate-voting-stats";
import { cn } from "@/lib/utils";
import { useCurrentVotingPhaseStatus } from "@/lib/hooks/voting/use-current-voting-phase-status";
import CandidateVotingShowResults from "./candidate-voting-show-results";
import CandidateVotingPhaseStatusList from "./candidate-voting-phase-status-list";
import { useCurrentCandidateVotes } from "@/lib/hooks/voting/use-current-candidate-votes";

type Vote = {
  candidateId: string;
  decision: "approve" | "reject";
  timestamp: Date;
};

interface CandidateVotingSlideshowProps {
  candidates: CandidateWithMetadata[];
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
}

export function CandidateVotingSlideshow({
  candidates,
  admin,
  currentVotingPhase = null,
  submitVoteAction,
  changeCurrentVotingPhaseStatusCandidateAction,
  recruiterVotes,
}: CandidateVotingSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(
    candidates.findIndex(
      (c) => c.id === currentVotingPhase?.status.candidateId,
    ),
  );

  const [approvedCount, setApprovedCount] = useState<number>(0);
  const [rejectedCount, setRejectedCount] = useState<number>(0);
  const [finishedCandidates, setFinishedCandidates] = useState<number>(0);

  const [direction, setDirection] = useState<"next" | "prev">("next");

  const [alreadyVotedForCurrentCandidate, setAlreadyVotedForCurrentCandidate] =
    useState<boolean>(false);

  const [currentCandidate, setCurrentCandidate] =
    useState<CandidateWithMetadata>(candidates[currentIndex]);

  const { votingPhaseStatus } = useCurrentVotingPhaseStatus(
    currentVotingPhase?.id,
  );

  const { votes } = useCurrentCandidateVotes(
    currentVotingPhase.id,
    currentCandidate?.id,
  );

  const handleNext = () => {
    if (currentIndex < candidates.length - 1) {
      setDirection("next");
      setCurrentIndex(currentIndex + 1);
      setCurrentCandidate(candidates[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDirection("prev");
      setCurrentIndex(currentIndex - 1);
      setCurrentCandidate(candidates[currentIndex - 1]);
    }
  };

  const votedCount = finishedCandidates;

  useEffect(() => {
    const newIndex = candidates.findIndex(
      (c) => c.id === votingPhaseStatus?.candidateId,
    );
    if (newIndex !== -1) {
      setCurrentIndex(newIndex);
      setCurrentCandidate(candidates[newIndex]);
    }
  }, [votingPhaseStatus, candidates]);

  return (
    <CandidateVotingProvider
      candidates={candidates}
      admin={admin ? true : false}
      currentVotingPhase={currentVotingPhase}
      submitVoteAction={submitVoteAction}
      alreadyVotedForCurrentCandidate={alreadyVotedForCurrentCandidate}
      setAlreadyVotedForCurrentCandidate={setAlreadyVotedForCurrentCandidate}
      changeCurrentVotingPhaseStatusCandidateAction={
        changeCurrentVotingPhaseStatusCandidateAction
      }
      recruiterVotes={recruiterVotes}
      currentCandidate={currentCandidate}
      setCurrentCandidate={setCurrentCandidate}
    >
      {currentVotingPhase ? (
        <div className="flex flex-col bg-background">
          {admin && (
            <header className="border-b border-border bg-card">
              <CandidateVotingStats
                currentCandidateVotes={votes?.length}
                votedCount={votedCount}
                totalToVote={candidates.length}
                approvedCount={approvedCount}
                rejectedCount={rejectedCount}
              />
            </header>
          )}

          <CandidateVotingOptions />

          <div className="mt-8">
            <div className="flex items-center justify-center gap-2">
              {candidates.map((candidate, idx) => {
                return (
                  <button
                    key={candidate.id}
                    onClick={() => {
                      setDirection(idx > currentIndex ? "next" : "prev");
                      setCurrentIndex(idx);
                    }}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-muted",
                    )}
                  />
                );
              })}
            </div>
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
                <CandidateQuickInfo candidate={currentCandidate} />

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
        <section className="flex flex-col gap-4 mx-auto items-center justify-center">
          {admin && <CandidateVotingStartButton />}

          <CandidateVotingPhaseStatusList />
        </section>
      )}
    </CandidateVotingProvider>
  );
}
