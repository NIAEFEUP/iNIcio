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
) => ["application-comments", recruitmentId ?? null, candidateId];

export const interviewKey = (
  candidateId: string,
  recruitmentId?: number | null,
) => ["interview", recruitmentId ?? null, candidateId];

export const dynamicKey = (
  dynamicId: number,
  recruitmentId?: number | null,
) => ["dynamic", recruitmentId ?? null, dynamicId];

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
  return useSWR<Array<Comment>>(
    applicationCommentsKey(candidateId, recruitmentId),
    () => loadApplicationComments(candidateId),
  );
}

export function useInterviewData(candidateId: string) {
  const { recruitmentId } = useRecruitment();
  return useSWR(interviewKey(candidateId, recruitmentId), () =>
    loadInterview(candidateId),
  );
}

export function useDynamicData(dynamicId: number) {
  const { recruitmentId } = useRecruitment();
  return useSWR(dynamicKey(dynamicId, recruitmentId), () =>
    loadDynamic(dynamicId),
  );
}
