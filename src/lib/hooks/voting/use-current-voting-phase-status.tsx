"use client";

import { VotingPhaseStatus } from "@/lib/db";
import useSWR from "swr";

interface CurrentVotingPhaseStatusResponse {
  votingPhaseStatus: VotingPhaseStatus | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCurrentVotingPhaseStatus(votingPhaseId: number) {
  const { data, error, isLoading, mutate } =
    useSWR<CurrentVotingPhaseStatusResponse>(
      `/api/votingphase/${votingPhaseId}/status`,
      fetcher,
      {
        refreshInterval: 1000,
      },
    );

  return {
    votingPhaseStatus: data?.votingPhaseStatus || null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
