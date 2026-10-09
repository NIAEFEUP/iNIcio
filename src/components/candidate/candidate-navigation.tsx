"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCandidatesData } from "@/lib/hooks/candidates/use-candidate-data";

export interface AdjacentCandidateSummary {
  id: string;
  name: string;
}

interface CandidateNavigationProps {
  currentCandidateId: string;
  adjacentCandidates?: {
    prev: AdjacentCandidateSummary | null;
    next: AdjacentCandidateSummary | null;
  };
}

export function CandidateNavigation({
  currentCandidateId,
  adjacentCandidates,
}: CandidateNavigationProps) {
  const hasAdjacent = Boolean(adjacentCandidates);
  const { data, isLoading } = useCandidatesData(undefined, !hasAdjacent);
  const candidates = data?.candidates;

  const prevCandidate = hasAdjacent
    ? adjacentCandidates?.prev
    : (() => {
        if (isLoading || !candidates) return null;
        const idx = candidates.findIndex((c) => c.id === currentCandidateId);
        return idx > 0 ? candidates[idx - 1] : null;
      })();

  const nextCandidate = hasAdjacent
    ? adjacentCandidates?.next
    : (() => {
        if (isLoading || !candidates) return null;
        const idx = candidates.findIndex((c) => c.id === currentCandidateId);
        return idx >= 0 && idx < candidates.length - 1
          ? candidates[idx + 1]
          : null;
      })();

  if (!hasAdjacent && (isLoading || !candidates || candidates.length === 0)) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          disabled
          className="px-2 md:px-4"
          aria-label="Anterior"
        >
          <ChevronLeft className="size-4 md:mr-1" />
          <span className="hidden md:inline">Anterior</span>
        </Button>
        <Button
          variant="outline"
          disabled
          className="px-2 md:px-4"
          aria-label="Próximo"
        >
          <span className="hidden md:inline">Próximo</span>
          <ChevronRight className="size-4 md:ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {prevCandidate ? (
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href={`/candidate/${prevCandidate.id}`} />}
          title={`Anterior: ${prevCandidate.name}`}
          aria-label={`Anterior: ${prevCandidate.name}`}
          className="max-w-[200px] px-2 md:px-4"
        >
          <ChevronLeft className="size-4 md:mr-1" />
          <span className="hidden truncate md:inline">
            {prevCandidate.name}
          </span>
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled
          className="px-2 md:px-4"
          aria-label="Anterior"
        >
          <ChevronLeft className="size-4 md:mr-1" />
          <span className="hidden md:inline">Anterior</span>
        </Button>
      )}

      {nextCandidate ? (
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href={`/candidate/${nextCandidate.id}`} />}
          title={`Próximo: ${nextCandidate.name}`}
          aria-label={`Próximo: ${nextCandidate.name}`}
          className="max-w-[200px] px-2 md:px-4"
        >
          <span className="hidden truncate md:inline">
            {nextCandidate.name}
          </span>
          <ChevronRight className="size-4 md:ml-1" />
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled
          className="px-2 md:px-4"
          aria-label="Próximo"
        >
          <span className="hidden md:inline">Próximo</span>
          <ChevronRight className="size-4 md:ml-1" />
        </Button>
      )}
    </div>
  );
}
