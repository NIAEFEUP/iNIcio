import { Button } from "@/components/ui/button";
import { CandidateVotingContext } from "@/lib/contexts/CandidateVotingContext";
import { useCurrentCandidateVotes } from "@/lib/hooks/voting/use-current-candidate-votes";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { useContext, useEffect, useState } from "react";

export default function CandidateVotingShowResults() {
  const [show, setShow] = useState<boolean>(false);

  const { currentCandidate, currentVotingPhase } = useContext(
    CandidateVotingContext,
  );

  const { votes } = useCurrentCandidateVotes(
    currentVotingPhase.id,
    currentCandidate.id,
  );

  const [approvedCount, setApprovedCount] = useState<number>(
    votes ? votes.filter((v) => v.decision === "approve").length : 0,
  );
  const [rejectedCount, setRejectedCount] = useState<number>(
    votes ? votes.filter((v) => v.decision === "reject").length : 0,
  );

  useEffect(() => {
    setApprovedCount(
      votes ? votes.filter((v) => v.decision === "approve").length : 0,
    );
    setRejectedCount(
      votes ? votes.filter((v) => v.decision === "reject").length : 0,
    );
  }, [votes]);

  return (
    <div className="flex flex-col gap-2">
      {show && (
        <>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-secondary" />
                <span className="text-lg font-medium text-foreground">
                  {approvedCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Aceites</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1.5">
                <X className="h-4 w-4 text-destructive" />
                <span className="text-lg font-medium text-foreground">
                  {rejectedCount}
                </span>
              </div>
              <p className="text-xs text-destructive/80">Rejeitados</p>
            </div>
          </div>
        </>
      )}
      <Button
        onClick={() => {
          setShow((prev) => !prev);
        }}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
