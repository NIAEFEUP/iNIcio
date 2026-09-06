"use client";

import { Button } from "@/components/ui/button";

import { useContext, useEffect } from "react";
import { CandidateVotingContext } from "@/lib/contexts/CandidateVotingContext";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/use-session";

export default function CandidateVotingOptions() {
  const router = useRouter();
  const {
    setAlreadyVotedForCurrentCandidate,
    alreadyVotedForCurrentCandidate,
    currentVotingPhase,
    submitVoteAction,
    recruiterVotes,
    currentCandidate,
  } = useContext(CandidateVotingContext);

  const { data: session } = useSession();

  useEffect(() => {
    setAlreadyVotedForCurrentCandidate(
      recruiterVotes.some((vote) => vote.candidateId === currentCandidate?.id),
    );
  }, [currentCandidate, setAlreadyVotedForCurrentCandidate, recruiterVotes]);

  async function handleVote(decision: "approve" | "reject") {
    if (!currentVotingPhase) return;

    if (!currentCandidate) return;
    if (
      await submitVoteAction(session?.user.id, currentCandidate.id, decision)
    ) {
      router.refresh();
      setAlreadyVotedForCurrentCandidate(true);
    }
  }

  return (
    <section className="flex flex-row gap-2 items-center justify-center mt-8">
      {alreadyVotedForCurrentCandidate ? (
        <p>Voto submetido!</p>
      ) : (
        <>
          <Button onClick={async () => await handleVote("approve")}>
            Aceitar
          </Button>
          <Button
            onClick={async () => await handleVote("reject")}
            variant="secondary"
          >
            Rejeitar
          </Button>
        </>
      )}
    </section>
  );
}
