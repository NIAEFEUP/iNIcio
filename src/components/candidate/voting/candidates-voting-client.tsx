"use client";

import { User } from "@/lib/db";
import { useState } from "react";
import CandidateQuickInfo from "@/components/candidate/page/candidate-quick-info";

import { CandidateWithMetadata } from "@/lib/candidate";
import CandidateFiltering from "../filter/candidate-filtering";
import { Button } from "@/components/ui/button";
import { createVotingPhase } from "@/lib/voting";

import { redirect, useRouter } from "next/navigation";

interface CandidatesClientProps {
  authUser: User;
  candidates: Array<CandidateWithMetadata>;
  availableDepartments: Array<string>;
  handleCandidateSelection: (
    candidates: Array<CandidateWithMetadata>,
  ) => Promise<number | null>;
}

export default function CandidateVotingChoiceClient({
  authUser,
  candidates,
  availableDepartments,
  handleCandidateSelection,
}: CandidatesClientProps) {
  const router = useRouter();

  const [selectedCandidates, setSelectedCandidates] = useState<
    Array<CandidateWithMetadata>
  >([]);

  const [filteredCandidates, setFilteredCandidates] =
    useState<Array<User>>(candidates);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-center mb-4">
        <span className="font-bold">{filteredCandidates.length}</span>{" "}
        candidaturas
      </h2>

      {selectedCandidates.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-2">
          <Button
            onClick={async () => {
              const votingPhaseId =
                await handleCandidateSelection(selectedCandidates);

              if (votingPhaseId) {
                router.push(
                  `/candidates/voting/${votingPhaseId[0].votingPhaseId}`,
                );
              }
            }}
          >
            Criar com {selectedCandidates.length} candidatos
          </Button>
        </div>
      )}

      <CandidateFiltering
        candidates={candidates}
        setFilteredCandidates={setFilteredCandidates}
        availableDepartments={availableDepartments}
      />

      <div className="mx-auto w-full max-w-[80em] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
        {filteredCandidates.map((candidate: CandidateWithMetadata) => (
          <CandidateQuickInfo
            key={candidate.id || crypto.randomUUID()}
            candidate={candidate}
            authUser={authUser}
            selectActionActive={true}
            selectActionHandler={(
              checked: boolean,
              candidate: CandidateWithMetadata,
            ) => {
              if (checked) {
                setSelectedCandidates((prev) => [...prev, candidate]);
              } else {
                setSelectedCandidates((prev) =>
                  prev.filter((c) => c.id !== candidate.id),
                );
              }
            }}
            candidateSelected={selectedCandidates.includes(candidate)}
          />
        ))}

        {filteredCandidates.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            Nenhum resultado encontrado
          </p>
        )}
      </div>
    </div>
  );
}
