"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCandidatesData } from "@/lib/hooks/candidates/use-candidate-data";

interface CandidateNavigationProps {
  currentCandidateId: string;
}

export function CandidateNavigation({
  currentCandidateId,
}: CandidateNavigationProps) {
  const { data, isLoading } = useCandidatesData();
  const candidates = data?.candidates;

  if (isLoading || !candidates || candidates.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" disabled className="px-2 md:px-4">
          <ChevronLeft className="size-4 md:mr-1" />
          <span className="hidden md:inline">Anterior</span>
        </Button>
        <Button variant="outline" disabled className="px-2 md:px-4">
          <span className="hidden md:inline">Próximo</span>
          <ChevronRight className="size-4 md:ml-1" />
        </Button>
      </div>
    );
  }

  const currentIndex = candidates.findIndex((c) => c.id === currentCandidateId);

  const prevCandidate = currentIndex > 0 ? candidates[currentIndex - 1] : null;
  const nextCandidate =
    currentIndex >= 0 && currentIndex < candidates.length - 1
      ? candidates[currentIndex + 1]
      : null;

  return (
    <div className="flex items-center gap-2">
      {prevCandidate ? (
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href={`/candidate/${prevCandidate.id}`} />}
          title={`Anterior: ${prevCandidate.name}`}
          className="max-w-[200px] px-2 md:px-4"
        >
          <ChevronLeft className="size-4 md:mr-1" />
          <span className="hidden truncate md:inline">
            {prevCandidate.name}
          </span>
        </Button>
      ) : (
        <Button variant="outline" disabled className="px-2 md:px-4">
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
          className="max-w-[200px] px-2 md:px-4"
        >
          <span className="hidden truncate md:inline">
            {nextCandidate.name}
          </span>
          <ChevronRight className="size-4 md:ml-1" />
        </Button>
      ) : (
        <Button variant="outline" disabled className="px-2 md:px-4">
          <span className="hidden md:inline">Próximo</span>
          <ChevronRight className="size-4 md:ml-1" />
        </Button>
      )}
    </div>
  );
}
