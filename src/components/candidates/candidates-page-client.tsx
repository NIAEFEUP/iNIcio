"use client";

import { useEffect } from "react";
import { useSWRConfig } from "swr";

import {
  DataErrorState,
  DataLoadingState,
} from "@/components/data-table/data-state-view";
import type { ViewMode } from "@/components/data-table/view-mode-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useRecruitment } from "@/lib/contexts/recruitment-context";
import {
  candidateKey,
  useCandidatesData,
} from "@/lib/hooks/candidates/use-candidate-data";

import CandidatesClient from "./candidates-client";

export default function CandidatesPageClient({
  initialViewMode = "grid",
}: {
  initialViewMode?: ViewMode;
}) {
  const { data, isLoading, error } = useCandidatesData();
  const { mutate } = useSWRConfig();
  const { recruitmentId } = useRecruitment();
  const { user } = useAuth();

  useEffect(() => {
    if (!data?.candidates) return;
    for (const candidate of data.candidates) {
      mutate(candidateKey(candidate.id, recruitmentId), candidate, {
        revalidate: false,
      });
    }
  }, [data, recruitmentId, mutate]);

  if (error) {
    return (
      <DataErrorState
        title="Erro a carregar candidatos"
        message={error instanceof Error ? error.message : undefined}
      />
    );
  }

  if (isLoading && !data) {
    return <DataLoadingState message="A carregar candidatos..." />;
  }

  return (
    <CandidatesClient
      candidates={data?.candidates ?? []}
      availableDepartments={data?.availableDepartments ?? []}
      authUser={user ? { id: user.id } : null}
      initialViewMode={initialViewMode}
    />
  );
}
