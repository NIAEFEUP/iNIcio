import { Button } from "@/components/ui/button";
import { CandidateVotingContext } from "@/lib/contexts/CandidateVotingContext";
import { useCurrentCandidateVotes } from "@/lib/hooks/voting/use-current-candidate-votes";
import { useContext, useState } from "react";

export default function CandidateVotingShowResults() {
  const [show, setShow] = useState<boolean>(false);

  const { currentCandidate, currentVotingPhase } = useContext(
    CandidateVotingContext,
  );

  const { votes } = useCurrentCandidateVotes(
    currentVotingPhase.id,
    currentCandidate.id,
  );

  console.log("VOTES: ", votes);

  return (
    <Button
      onClick={() => {
        setShow((prev) => !prev);
      }}
    >
      {show ? "Fechar" : "Mostrar"} resultados
    </Button>
  );
}
