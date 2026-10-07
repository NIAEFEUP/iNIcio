"use server";

import { and, eq } from "drizzle-orm";

import { candidate } from "@/db/schema";
import {
  requireAdminSession,
  requireRecruiterSession,
} from "@/lib/action-guard";
import { submitApplicationComment } from "@/lib/application";
import { getAllPossibleApplicationInterests } from "@/lib/application";
import type { CandidateWithMetadata } from "@/lib/candidate";
import { getCandidateWithMetadata } from "@/lib/candidate";
import { createVotingPhase } from "@/lib/voting";
import {
  getApplicationComments,
  getDynamicComments,
  updateApplicationComment,
  voteApplicationComment as libVoteApplicationComment,
  voteInterviewComment as libVoteInterviewComment,
  voteDynamicComment as libVoteDynamicComment,
} from "@/lib/comment";
import { db, User } from "@/lib/db";
import type { Comment } from "@/components/candidate/page/candidate-comments";
import {
  isVoteValue,
  type CommentVoteSummary,
  type VoteValue,
} from "@/lib/comment-vote";
import {
  createDynamicComment,
  getDynamic,
  getDynamicInterviewers,
  getAllCandidatesWithDynamic,
  updateDynamic,
  updateDynamicComment,
  toggleDynamicLock,
} from "@/lib/dynamic";
import {
  addInterviewComment,
  getInterview,
  getInterviewComments,
  getInterviewers,
  updateInterview,
  updateInterviewComment,
  toggleInterviewLock,
} from "@/lib/interview";
import { generateJWT } from "@/lib/jwt";
import { getRecruiters } from "@/lib/recruiter";
import { getRole } from "@/lib/role";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";

export interface InterviewData {
  candidate: CandidateWithMetadata;
  interview: NonNullable<Awaited<ReturnType<typeof getInterview>>>;
  interviewers: Array<User>;
  comments: Array<Comment>;
  recruiters: Array<User>;
  token: string;
}

export interface DynamicData {
  dynamic: NonNullable<Awaited<ReturnType<typeof getDynamic>>>;
  interviewers: Array<User>;
  comments: Array<Comment>;
  recruiters: Array<User>;
  token: string;
}

export async function loadCandidates() {
  const targetId = await getTargetRecruitmentId();
  await requireRecruiterSession(targetId);

  const [candidates, availableDepartments] = await Promise.all([
    getAllCandidatesWithDynamic(targetId),
    getAllPossibleApplicationInterests(),
  ]);

  return { candidates, availableDepartments };
}

export async function loadCandidate(
  candidateId: string,
): Promise<CandidateWithMetadata> {
  const targetId = await getTargetRecruitmentId();
  await requireRecruiterSession(targetId);

  return getCandidateWithMetadata(candidateId, targetId);
}

export async function loadRecruiters(): Promise<Array<User>> {
  const targetId = await getTargetRecruitmentId();
  await requireRecruiterSession(targetId);

  return getRecruiters(targetId);
}

export async function loadApplicationComments(
  candidateId: string,
): Promise<Array<Comment>> {
  const targetId = await getTargetRecruitmentId();
  const user = await requireRecruiterSession(targetId);

  return getApplicationComments(candidateId, user.id, targetId);
}

export async function loadInterview(
  candidateId: string,
): Promise<InterviewData> {
  const targetId = await getTargetRecruitmentId();
  const user = await requireRecruiterSession(targetId);

  const [candidate, interview] = await Promise.all([
    getCandidateWithMetadata(candidateId, targetId),
    getInterview(candidateId, targetId),
  ]);

  if (!interview) throw new Error("Interview not found");

  const [interviewers, comments, recruiters] = await Promise.all([
    getInterviewers(interview.id),
    getInterviewComments(interview.id, user.id),
    getRecruiters(targetId),
  ]);

  const token = await generateJWT(user.id, await getRole(user.id), [
    `interview-${candidateId}`,
  ]);

  return { candidate, interview, interviewers, comments, recruiters, token };
}

export async function loadDynamic(dynamicId: number): Promise<DynamicData> {
  const targetId = await getTargetRecruitmentId();
  const user = await requireRecruiterSession(targetId);

  const dynamic = await getDynamic(dynamicId, targetId);
  if (!dynamic) throw new Error("Dynamic not found");

  const [interviewers, comments, recruiters] = await Promise.all([
    getDynamicInterviewers(dynamic.id),
    getDynamicComments(dynamic.id, user.id),
    getRecruiters(targetId),
  ]);

  const token = await generateJWT(user.id, await getRole(user.id), [
    `dynamic-${dynamicId}`,
  ]);

  return { dynamic, interviewers, comments, recruiters, token };
}

export async function saveApplicationComment(
  candidateId: string,
  content: Array<unknown>,
): Promise<{ success: boolean; id?: number }> {
  const targetId = await getTargetRecruitmentId();
  if (targetId === undefined) return { success: false };
  const user = await requireRecruiterSession(targetId);

  const id = await submitApplicationComment(
    candidateId,
    content,
    user.id,
    targetId,
  );
  return id !== null ? { success: true, id } : { success: false };
}

export async function editApplicationComment(
  candidateId: string,
  commentId: number,
  content: Array<unknown>,
): Promise<boolean> {
  const targetId = await getTargetRecruitmentId();
  if (targetId === undefined) return false;
  const user = await requireRecruiterSession(targetId);

  return updateApplicationComment(
    commentId,
    content,
    user.id,
    candidateId,
    targetId,
  );
}

export async function saveInterviewComment(
  candidateId: string,
  content: Array<unknown>,
): Promise<{ success: boolean; id?: number }> {
  const targetId = await getTargetRecruitmentId();
  if (targetId === undefined) return { success: false };
  const user = await requireRecruiterSession(targetId);

  const id = await addInterviewComment(user.id, content, candidateId, targetId);
  return id !== null ? { success: true, id } : { success: false };
}

export async function editInterviewComment(
  candidateId: string,
  commentId: number,
  content: Array<unknown>,
): Promise<boolean> {
  const targetId = await getTargetRecruitmentId();
  if (targetId === undefined) return false;
  const user = await requireRecruiterSession(targetId);

  return updateInterviewComment(
    commentId,
    content,
    user.id,
    candidateId,
    targetId,
  );
}

export async function saveDynamicComment(
  dynamicId: number,
  content: Array<unknown>,
): Promise<{ success: boolean; id?: number }> {
  const targetId = await getTargetRecruitmentId();
  if (targetId === undefined) return { success: false };
  const user = await requireRecruiterSession(targetId);

  const dynamic = await getDynamic(dynamicId, targetId);
  if (!dynamic)
    throw new Error("Dynamic not found in the selected recruitment");

  const id = await createDynamicComment(dynamicId, content, user.id);
  return id !== null ? { success: true, id } : { success: false };
}

export async function editDynamicComment(
  dynamicId: number,
  commentId: number,
  content: Array<unknown>,
): Promise<boolean> {
  const targetId = await getTargetRecruitmentId();
  if (targetId === undefined) return false;
  const user = await requireRecruiterSession(targetId);

  return updateDynamicComment(commentId, content, user.id, dynamicId, targetId);
}

// Shared guard for the three vote actions: resolve the recruitment, reject
// malformed vote values, require a recruiter session, and exclude admins.
async function authorizeCommentVote(value: unknown) {
  const recruitmentId = await getTargetRecruitmentId();
  if (recruitmentId === undefined) return null;
  if (!isVoteValue(value)) return null;

  const user = await requireRecruiterSession(recruitmentId);
  if (user.role === "admin") return null;

  return { value, userId: user.id, recruitmentId };
}

export async function voteApplicationComment(
  candidateId: string,
  commentId: number,
  value: VoteValue,
): Promise<CommentVoteSummary | null> {
  const vote = await authorizeCommentVote(value);
  if (!vote) return null;

  return libVoteApplicationComment(
    commentId,
    vote.userId,
    vote.value,
    candidateId,
    vote.recruitmentId,
  );
}

export async function voteInterviewComment(
  candidateId: string,
  commentId: number,
  value: VoteValue,
): Promise<CommentVoteSummary | null> {
  const vote = await authorizeCommentVote(value);
  if (!vote) return null;

  return libVoteInterviewComment(
    commentId,
    vote.userId,
    vote.value,
    candidateId,
    vote.recruitmentId,
  );
}

export async function voteDynamicComment(
  dynamicId: number,
  commentId: number,
  value: VoteValue,
): Promise<CommentVoteSummary | null> {
  const vote = await authorizeCommentVote(value);
  if (!vote) return null;

  return libVoteDynamicComment(
    commentId,
    vote.userId,
    vote.value,
    dynamicId,
    vote.recruitmentId,
  );
}

export async function updateInterviewContent(
  candidateId: string,
  content: unknown,
) {
  const targetId = await getTargetRecruitmentId();
  await requireRecruiterSession(targetId);

  const updated = await updateInterview(candidateId, content, targetId);
  if (!updated) {
    throw new Error("A entrevista está bloqueada ou não existe.");
  }
}

export async function setInterviewLocked(candidateId: string, locked: boolean) {
  const targetId = await getTargetRecruitmentId();
  await requireRecruiterSession(targetId);

  await toggleInterviewLock(candidateId, locked, targetId);
}

export async function updateDynamicContent(
  dynamicId: number,
  content: unknown,
) {
  const targetId = await getTargetRecruitmentId();
  await requireRecruiterSession(targetId);

  const updated = await updateDynamic(dynamicId, content, targetId);
  if (!updated) {
    throw new Error("A dinâmica está bloqueada ou não existe.");
  }
}

export async function setDynamicLocked(dynamicId: number, locked: boolean) {
  const targetId = await getTargetRecruitmentId();
  await requireRecruiterSession(targetId);

  await toggleDynamicLock(dynamicId, locked, targetId);
}

async function classifyCandidate(
  candidateId: string,
  classification: string,
  column: "interviewClassification" | "dynamicClassification",
) {
  const targetId = await getTargetRecruitmentId();
  await requireRecruiterSession(targetId);

  await db
    .update(candidate)
    .set({ [column]: classification })
    .where(
      and(
        eq(candidate.userId, candidateId),
        eq(candidate.recruitmentId, targetId),
      ),
    );
}

export async function classifyInterview(
  candidateId: string,
  classification: string,
) {
  await classifyCandidate(
    candidateId,
    classification,
    "interviewClassification",
  );
}

export async function classifyDynamic(
  candidateId: string,
  classification: string,
) {
  await classifyCandidate(candidateId, classification, "dynamicClassification");
}

export async function createVotingSessionAction(
  candidateIds: Array<string>,
): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    await requireAdminSession();
    const targetId = await getTargetRecruitmentId();
    if (!targetId) {
      return { success: false, error: "Nenhum recrutamento ativo selecionado" };
    }

    if (
      !candidateIds ||
      !Array.isArray(candidateIds) ||
      candidateIds.length === 0
    ) {
      return { success: false, error: "Nenhum candidato selecionado" };
    }

    const votingPhaseId = await createVotingPhase(candidateIds, targetId);
    if (!votingPhaseId) {
      return { success: false, error: "Falha ao criar sessão de votação" };
    }

    return { success: true, id: votingPhaseId };
  } catch (error) {
    console.error("Error creating voting session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar votação",
    };
  }
}
