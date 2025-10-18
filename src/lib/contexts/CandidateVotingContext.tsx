"use client";

import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
} from "react";
import { VotingPhase } from "../db";

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
      }}
    >
      {children}
    </CandidateVotingContext.Provider>
  );
}
