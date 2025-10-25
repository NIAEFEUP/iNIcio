"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CandidateVotingStartButton() {
  const router = useRouter();

  // const { createVotingPhaseAction } = useContext(CandidateVotingContext);

  // async function submit(e: FormEvent<HTMLFormElement>) {
  //   e.preventDefault();
  //
  //   if (await createVotingPhaseAction()) {
  //     router.refresh();
  //   }
  // }

  return (
    <>
      <Button asChild>
        <Link href="/candidates/voting/create">Começar votação</Link>
      </Button>
    </>
  );
}
