import { useState, useEffect, useContext } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CandidateVotingContext } from "@/lib/contexts/CandidateVotingContext";

interface CandidateVotingSlideshowArrowsProps {
  handlePrevious: () => void;
  currentIndex: number;
  handleNext: () => void;
  finalIndex: number;
}

export default function CandidateVotingSlideshowArrows({
  handlePrevious,
  currentIndex,
  handleNext,
  finalIndex,
}: CandidateVotingSlideshowArrowsProps) {
  const {
    candidates,
    changeCurrentVotingPhaseStatusCandidateAction,
    currentVotingPhase,
  } = useContext(CandidateVotingContext);

  async function handleCandidateChange(candidateId: string) {
    return await changeCurrentVotingPhaseStatusCandidateAction(
      currentVotingPhase.id,
      candidateId,
    );
  }

  return (
    <>
      <div className="absolute left-0 top-1/2 -translate-x-16 -translate-y-1/2">
        <Button
          variant="outline"
          size="icon"
          onClick={async () => {
            if (await handleCandidateChange(candidates[currentIndex - 1].id)) {
              handlePrevious();
            }
          }}
          disabled={currentIndex === 0}
          className="h-12 w-12 rounded-full bg-transparent"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>
      <div className="absolute right-0 top-1/2 translate-x-16 -translate-y-1/2">
        <Button
          variant="outline"
          size="icon"
          onClick={async () => {
            if (await handleCandidateChange(candidates[currentIndex + 1].id)) {
              handleNext();
            }
          }}
          disabled={currentIndex === finalIndex}
          className="h-12 w-12 rounded-full bg-transparent"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}
