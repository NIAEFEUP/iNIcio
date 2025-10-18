"use client";

import { Button } from "@/components/ui/button";
import { CandidateVotingContext } from "@/lib/contexts/CandidateVotingContext";
import { useRouter } from "next/navigation";
import { FormEvent, useContext } from "react";

export default function CandidateVotingStartButton() {
  const router = useRouter();

  const { createVotingPhaseAction } = useContext(CandidateVotingContext);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (await createVotingPhaseAction()) {
      router.refresh();
    }
  }

  return (
    <>
      <form method="POST" onSubmit={submit}>
        <Button type="submit">Começar votação</Button>
      </form>
    </>
  );
}
