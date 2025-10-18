"use client";

import { Button } from "@/components/ui/button";

import { useContext } from "react";
import { CandidateVotingContext } from "@/lib/contexts/CandidateVotingContext";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function CandidateVotingOptions() {
  const router = useRouter();
  const {
    setAlreadyVotedForCurrentCandidate,
    alreadyVotedForCurrentCandidate,
    candidates,
    currentVotingPhase,
    submitVoteAction,
  } = useContext(CandidateVotingContext);

  const { data: session } = authClient.useSession();

  async function handleVote(decision: "approve" | "reject") {
    if (!currentVotingPhase) return;

    const candidate = candidates.find(
      (c) => c.id === currentVotingPhase.status.candidateId,
    );

    if (!candidate) return;

    if (
      await submitVoteAction(
        currentVotingPhase.id,
        session?.user.id,
        candidate.id,
        decision,
      )
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
