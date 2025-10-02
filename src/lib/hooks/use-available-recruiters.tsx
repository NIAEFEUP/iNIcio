"use client";

import useSWR from "swr";
import { User } from "../db";

interface AvailableRecruitersResponse {
  recruiters: User[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAvailableRecruiters(start: Date, end: Date) {
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  const { data, error, isLoading, mutate } =
    useSWR<AvailableRecruitersResponse>(
      `/api/recruiter/availability?start=${startISO}&end=${endISO}`,
      fetcher,
    );

  return {
    recruiters: data?.recruiters || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
