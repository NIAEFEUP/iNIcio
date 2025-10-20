"use client";

import { CandidateVote } from "@/lib/db";
import useSWR from "swr";

interface CurrentCandidateVotesResponse {
  votes: Array<CandidateVote>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCurrentCandidateVotes(
  votingPhaseId: number,
  candidateId: string,
) {
  const { data, error, isLoading, mutate } =
    useSWR<CurrentCandidateVotesResponse>(
      `/api/votingphase/${votingPhaseId}/candidates/${candidateId}/votes`,
      fetcher,
      {
        refreshInterval: 1000,
      },
    );

  return {
    votes: data?.votes || null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
