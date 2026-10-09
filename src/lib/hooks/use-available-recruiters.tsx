"use client";

import useSWR from "swr";
import { User } from "../db";

interface AvailableRecruitersResponse {
  recruiters: User[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAvailableRecruiters(
  start: Date,
  end: Date,
  recruitmentId?: number,
) {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
  });
  if (recruitmentId !== undefined) {
    params.set("recruitmentId", String(recruitmentId));
  }

  const { data, error, isLoading, mutate } =
    useSWR<AvailableRecruitersResponse>(
      `/api/recruiter/availability?${params.toString()}`,
      fetcher,
    );

  return {
    recruiters: data?.recruiters || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
