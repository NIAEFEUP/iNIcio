"use client";

import useSWR from "swr";
import type { Comment } from "@/components/candidate/page/candidate-comments";
import {
  loadApplicationComments,
  loadCandidate,
  loadCandidates,
  loadDynamic,
  loadInterview,
  loadRecruiters,
} from "@/app/candidate/actions";
import type { CandidateWithMetadata } from "@/lib/candidate";
import type { User } from "@/lib/db";
import { useRecruitment } from "@/lib/contexts/recruitment-context";
import { useAuth } from "@/hooks/use-auth";

export const candidatesKey = (recruitmentId?: number | null) => [
  "candidates",
  recruitmentId ?? null,
];

export const candidateKey = (
  candidateId: string,
  recruitmentId?: number | null,
) => (candidateId ? ["candidate", recruitmentId ?? null, candidateId] : null);

export const recruitersKey = (recruitmentId?: number | null) => [
  "recruiters",
  recruitmentId ?? null,
];

export const applicationCommentsKey = (
  candidateId: string,
  recruitmentId?: number | null,
  userId?: string,
) =>
  candidateId
    ? [
        "application-comments",
        recruitmentId ?? null,
        candidateId,
        userId ?? null,
      ]
    : null;

export const interviewKey = (
  candidateId: string,
  recruitmentId?: number | null,
  userId?: string,
) =>
  candidateId
    ? ["interview", recruitmentId ?? null, candidateId, userId ?? null]
    : null;

export const dynamicKey = (
  dynamicId: number,
  recruitmentId?: number | null,
  userId?: string,
) =>
  dynamicId
    ? ["dynamic", recruitmentId ?? null, dynamicId, userId ?? null]
    : null;

export function useCandidatesData(
  fallbackData?: Awaited<ReturnType<typeof loadCandidates>>,
  enabled: boolean = true,
) {
  const { recruitmentId } = useRecruitment();
  return useSWR(
    enabled ? candidatesKey(recruitmentId) : null,
    () => loadCandidates(),
    {
      fallbackData,
    },
  );
}

export function useCandidateData(
  candidateId: string,
  fallbackData?: CandidateWithMetadata,
) {
  const { recruitmentId } = useRecruitment();
  return useSWR(
    candidateKey(candidateId, recruitmentId),
    () => loadCandidate(candidateId),
    {
      fallbackData,
    },
  );
}

export function useRecruiters(fallbackData?: Array<User>) {
  const { recruitmentId } = useRecruitment();
  return useSWR<Array<User>>(
    recruitersKey(recruitmentId),
    () => loadRecruiters(),
    {
      fallbackData,
    },
  );
}

export const useRecruitersData = useRecruiters;

export function useInterviewData(candidateId: string) {
  const { recruitmentId } = useRecruitment();
  const { user } = useAuth();
  return useSWR(interviewKey(candidateId, recruitmentId, user?.id), () =>
    loadInterview(candidateId),
  );
}

export function useDynamicData(dynamicId: number) {
  const { recruitmentId } = useRecruitment();
  const { user } = useAuth();
  return useSWR(dynamicKey(dynamicId, recruitmentId, user?.id), () =>
    loadDynamic(dynamicId),
  );
}

export function useApplicationComments(
  candidateId: string,
  fallbackData?: Array<Comment>,
) {
  const { recruitmentId } = useRecruitment();
  const { user } = useAuth();
  return useSWR<Array<Comment>>(
    applicationCommentsKey(candidateId, recruitmentId, user?.id),
    () => loadApplicationComments(candidateId),
    {
      fallbackData,
    },
  );
}

export function optimisticAddComment(
  mutate: (key: unknown, data?: unknown, shouldRevalidate?: boolean) => void,
  key: unknown,
  newComment: Comment,
  currentComments: Comment[],
) {
  mutate(key, [...currentComments, newComment], false);
}
