"use client";

import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CandidateWithMetadata } from "@/lib/candidate";
import CandidateQuickInfo from "@/components/candidate/page/candidate-quick-info";
import CandidateVotingSlideshowArrows from "@/components/candidate/voting/candidate-voting-slideshow-arrows";
import CandidateVotingOptions from "./candidate-voting-options";
import { VotingPhase } from "@/lib/db";
import CandidateVotingStartButton from "./candidate-voting-start-button";
import { CandidateVotingProvider } from "@/lib/contexts/CandidateVotingContext";
import { createVotingPhase } from "@/lib/voting";
import CandidateVotingStats from "./candidate-voting-stats";
import { cn } from "@/lib/utils";

type Vote = {
  candidateId: string;
  decision: "approve" | "reject";
  timestamp: Date;
};

interface CandidateVotingSlideshowProps {
  candidates: CandidateWithMetadata[];
  admin: boolean;
  currentVotingPhase?: VotingPhase | null;
  createVotingPhaseAction: () => Promise<boolean>;
  submitVoteAction: (
    votingPhaseId: number,
    recruiterId: string,
    candidateId: string,
    decision: "approve" | "reject",
  ) => Promise<boolean>;
  changeCurrentVotingPhaseStatusCandidateAction: (
    votingPhaseId: number,
    candidateId: string,
  ) => Promise<boolean>;
}

export function CandidateVotingSlideshow({
  candidates,
  admin,
  currentVotingPhase = null,
  createVotingPhaseAction,
  submitVoteAction,
  changeCurrentVotingPhaseStatusCandidateAction,
}: CandidateVotingSlideshowProps) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const [alreadyVotedForCurrentCandidate, setAlreadyVotedForCurrentCandidate] =
    useState<boolean>(false);

  const currentCandidate: CandidateWithMetadata = candidates[currentIndex];

  const handleNext = () => {
    if (currentIndex < candidates.length - 1) {
      setDirection("next");
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDirection("prev");
      setCurrentIndex(currentIndex - 1);
    }
  };
  const votedCount = votes.length;
  const approvedCount = votes.filter((v) => v.decision === "approve").length;
  const rejectedCount = votes.filter((v) => v.decision === "reject").length;

  return (
    <CandidateVotingProvider
      candidates={candidates}
      admin={admin ? true : false}
      currentVotingPhase={currentVotingPhase}
      createVotingPhaseAction={createVotingPhaseAction}
      submitVoteAction={submitVoteAction}
      alreadyVotedForCurrentCandidate={alreadyVotedForCurrentCandidate}
      setAlreadyVotedForCurrentCandidate={setAlreadyVotedForCurrentCandidate}
      changeCurrentVotingPhaseStatusCandidateAction={
        changeCurrentVotingPhaseStatusCandidateAction
      }
    >
      {currentVotingPhase ? (
        <div className="flex flex-col bg-background">
          <header className="border-b border-border bg-card">
            <CandidateVotingStats
              votedCount={votedCount}
              totalToVote={candidates.length}
              approvedCount={approvedCount}
              rejectedCount={rejectedCount}
            />
          </header>

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
          <p>Não há nenhuma votação ativa</p>

          {admin && <CandidateVotingStartButton />}
        </section>
      )}
    </CandidateVotingProvider>
  );
}
