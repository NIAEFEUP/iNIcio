"use client";

import { useEffect } from "react";
import { useSWRConfig } from "swr";

import { DataErrorState } from "@/components/data-table/data-state-view";
import { PageLoading } from "@/components/layout/page-loading";
import type { ViewMode } from "@/components/data-table/view-mode-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useRecruitment } from "@/lib/contexts/recruitment-context";
import {
  candidateKey,
  useCandidatesData,
} from "@/lib/hooks/candidates/use-candidate-data";
import type { loadCandidates } from "@/app/candidate/actions";

import CandidatesClient from "./candidates-client";

export default function CandidatesPageClient({
  initialData,
  initialViewMode = "grid",
  initialScheduling = [],
}: {
  initialData?: Awaited<ReturnType<typeof loadCandidates>>;
  initialViewMode?: ViewMode;
  initialScheduling?: string[];
}) {
  const { data, isLoading, error } = useCandidatesData(initialData);
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
    return <PageLoading />;
  }

  return (
    <CandidatesClient
      candidates={data?.candidates ?? []}
      availableDepartments={data?.availableDepartments ?? []}
      authUser={user ? { id: user.id } : null}
      initialViewMode={initialViewMode}
      initialScheduling={initialScheduling}
    />
  );
}
