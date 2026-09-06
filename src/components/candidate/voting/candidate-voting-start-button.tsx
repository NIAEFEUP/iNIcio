"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CandidateVotingStartButton() {
  return (
    <>
      <Button render={<Link href="/candidates/voting/create" />}>
        Começar votação
      </Button>
    </>
  );
}
