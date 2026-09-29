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
) => ["candidate", recruitmentId ?? null, candidateId];

export const recruitersKey = (recruitmentId?: number | null) => [
  "recruiters",
  recruitmentId ?? null,
];

export const applicationCommentsKey = (
  candidateId: string,
  recruitmentId?: number | null,
  userId?: string,
) => [
  "application-comments",
  recruitmentId ?? null,
  candidateId,
  userId ?? null,
];

export const interviewKey = (
  candidateId: string,
  recruitmentId?: number | null,
  userId?: string,
) => ["interview", recruitmentId ?? null, candidateId, userId ?? null];

export const dynamicKey = (
  dynamicId: number,
  recruitmentId?: number | null,
  userId?: string,
) => ["dynamic", recruitmentId ?? null, dynamicId, userId ?? null];

export function useCandidatesData() {
  const { recruitmentId } = useRecruitment();
  return useSWR(candidatesKey(recruitmentId), () => loadCandidates());
}

export function useCandidateData(candidateId: string) {
  const { recruitmentId } = useRecruitment();
  return useSWR(candidateKey(candidateId, recruitmentId), () =>
    loadCandidate(candidateId),
  );
}

export function useRecruiters() {
  const { recruitmentId } = useRecruitment();
  return useSWR<Array<User>>(recruitersKey(recruitmentId), () =>
    loadRecruiters(),
  );
}

export function useApplicationComments(candidateId: string) {
  const { recruitmentId } = useRecruitment();
  const { user } = useAuth();
  return useSWR<Array<Comment>>(
    applicationCommentsKey(candidateId, recruitmentId, user?.id),
    () => loadApplicationComments(candidateId),
  );
}

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
