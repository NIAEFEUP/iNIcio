"use client";

import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
} from "react";
import { RecruiterVote, VotingPhase } from "../db";
import { CandidateWithMetadata } from "../candidate";

interface CandidateVotingContextType {
  candidates: any[];
  admin: boolean;
  currentVotingPhase: VotingPhase | null;
  createVotingPhaseAction: () => Promise<boolean>;
  submitVoteAction: (
    votingPhaseId: number,
    recruiterId: string,
    candidateId: string,
    decision: "approve" | "reject",
  ) => Promise<boolean>;
  alreadyVotedForCurrentCandidate: boolean;
  setAlreadyVotedForCurrentCandidate: Dispatch<SetStateAction<boolean>>;
  changeCurrentVotingPhaseStatusCandidateAction: (
    votingPhaseId: number,
    candidateId: string,
  ) => Promise<boolean>;
  recruiterVotes: RecruiterVote[];
  currentCandidate: CandidateWithMetadata;
  setCurrentCandidate: Dispatch<SetStateAction<CandidateWithMetadata>>;
}

interface CandidateVotingProviderProps {
  children: ReactNode;
  candidates: any[];
  admin: boolean;
  currentVotingPhase: VotingPhase | null;
  createVotingPhaseAction: () => Promise<boolean>;
  submitVoteAction: (
    votingPhaseId: number,
    recruiterId: string,
    candidateId: string,
    decision: "approve" | "reject",
  ) => Promise<boolean>;
  alreadyVotedForCurrentCandidate: boolean;
  setAlreadyVotedForCurrentCandidate: Dispatch<SetStateAction<boolean>>;
  changeCurrentVotingPhaseStatusCandidateAction: (
    votingPhaseId: number,
    candidateId: string,
  ) => Promise<boolean>;
  recruiterVotes: RecruiterVote[];
  currentCandidate: CandidateWithMetadata;
  setCurrentCandidate: Dispatch<SetStateAction<CandidateWithMetadata>>;
}

export const CandidateVotingContext =
  createContext<CandidateVotingContextType | null>(null);

export function CandidateVotingProvider({
  children,
  candidates,
  admin,
  currentVotingPhase,
  createVotingPhaseAction,
  submitVoteAction,
  alreadyVotedForCurrentCandidate,
  setAlreadyVotedForCurrentCandidate,
  changeCurrentVotingPhaseStatusCandidateAction,
  recruiterVotes,
  currentCandidate,
  setCurrentCandidate,
}: CandidateVotingProviderProps) {
  return (
    <CandidateVotingContext.Provider
      value={{
        candidates,
        admin,
        currentVotingPhase,
        createVotingPhaseAction,
        submitVoteAction,
        alreadyVotedForCurrentCandidate,
        setAlreadyVotedForCurrentCandidate,
        changeCurrentVotingPhaseStatusCandidateAction,
        recruiterVotes,
        currentCandidate,
        setCurrentCandidate,
      }}
    >
      {children}
    </CandidateVotingContext.Provider>
  );
}
