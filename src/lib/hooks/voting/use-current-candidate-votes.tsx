"use client";

import { CandidateVote } from "@/lib/db";
import useSWR from "swr";
import { useState } from "react";

interface CurrentCandidateVotesResponse {
  votes: Array<CandidateVote>;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      const error: any = new Error(
        "An error occurred while fetching the data.",
      );
      error.status = res.status;
      throw error;
    }
    return res.json();
  });

export function useCurrentCandidateVotes(
  votingPhaseId: number,
  candidateId: string,
) {
  const [isDisabled, setIsDisabled] = useState(false);
  const { data, error, isLoading, mutate } =
    useSWR<CurrentCandidateVotesResponse>(
      isDisabled
        ? null
        : `/api/votingphase/${votingPhaseId}/candidates/${candidateId}/votes`,
      fetcher,
      {
        refreshInterval: 1000,
        onError: (err) => {
          if (err.status === 401) {
            setIsDisabled(true);
          }
        },
      },
    );

  return {
    votes: data?.votes || null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
