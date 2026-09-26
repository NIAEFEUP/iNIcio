"use client";

import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
} from "react";
import { RecruiterVote, VotingPhase } from "../db";
import { CandidateVotingMetadata } from "../candidate";

interface CandidateVotingContextType {
  candidates: any[];
  admin: boolean;
  currentCandidateFinished: boolean;
  setCurrentCandidateFinished: Dispatch<SetStateAction<boolean>>;
  currentVotingPhase: VotingPhase | null;
  submitVoteAction: (
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
  currentCandidate: CandidateVotingMetadata;
  setCurrentCandidate: Dispatch<SetStateAction<CandidateVotingMetadata>>;
}

interface CandidateVotingProviderProps {
  children: ReactNode;
  candidates: any[];
  admin: boolean;
  currentCandidateFinished: boolean;
  setCurrentCandidateFinished: Dispatch<SetStateAction<boolean>>;
  currentVotingPhase: VotingPhase | null;
  submitVoteAction: (
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
  currentCandidate: CandidateVotingMetadata;
  setCurrentCandidate: Dispatch<SetStateAction<CandidateVotingMetadata>>;
}

export const CandidateVotingContext =
  createContext<CandidateVotingContextType | null>(null);

export function CandidateVotingProvider({
  children,
  candidates,
  admin,
  currentCandidateFinished,
  setCurrentCandidateFinished,
  currentVotingPhase,
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
        currentCandidateFinished,
        setCurrentCandidateFinished,
        currentVotingPhase,
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
