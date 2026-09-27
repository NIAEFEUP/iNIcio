"use client";

import * as React from "react";
import { useSWRConfig } from "swr";

import { CandidatePersonalInfoCard } from "./candidate-personal-info-card";
import { CandidateContactInfoCard } from "./candidate-contact-info-card";
import { CandidateLinksCard } from "@/components/candidate/candidate-links-card";
import { CandidateAcademicStatusCard } from "./candidate-academic-status-card";
import { CandidateDepartmentInterestsCard } from "./candidate-department-interests-card";
import { CandidateClassificationsCard } from "./candidate-classifications-card";
import { CandidateResultVotingCard } from "./candidate-result-voting-card";
import { candidateKey } from "@/lib/hooks/candidates/use-candidate-data";
import { classifyDynamic, classifyInterview } from "@/app/candidate/actions";
import type {
  CandidateListMetadata,
  CandidateWithMetadata,
} from "@/lib/candidate";
import type { RecruiterToCandidate } from "@/lib/db";
import { cn } from "@/lib/utils";

export interface CandidateModularInfoProps {
  candidate: CandidateWithMetadata | CandidateListMetadata;
  friends?: Array<RecruiterToCandidate>;
  authUser?: { id?: string } | null;
  recruitmentId?: number | null;
  onToggleKnown?: (known: boolean) => void | Promise<void>;
  onClassifyInterview?: (value: string) => Promise<void> | void;
  onClassifyDynamic?: (value: string) => Promise<void> | void;
  readOnly?: boolean;
  readOnlyInterview?: boolean;
  readOnlyDynamic?: boolean;
  showKnownCheckbox?: boolean;
  showContactInfo?: boolean;
  showLinks?: boolean;
  showAcademicStatus?: boolean;
  showDepartmentInterests?: boolean;
  showClassifications?: boolean;
  showResultVoting?: boolean;
  className?: string;
}

export function CandidateModularInfo({
  candidate,
  friends,
  authUser,
  recruitmentId,
  onToggleKnown,
  onClassifyInterview,
  onClassifyDynamic,
  readOnly = false,
  readOnlyInterview,
  readOnlyDynamic,
  showKnownCheckbox = true,
  showContactInfo = true,
  showLinks = true,
  showAcademicStatus = true,
  showDepartmentInterests = true,
  showClassifications = true,
  showResultVoting = true,
  className,
}: CandidateModularInfoProps) {
  const { mutate } = useSWRConfig();

  const handleClassifyInterview = async (value: string) => {
    if (onClassifyInterview) {
      await onClassifyInterview(value);
      return;
    }
    await classifyInterview(candidate.id, value);
    mutate(candidateKey(candidate.id, recruitmentId));
  };

  const handleClassifyDynamic = async (value: string) => {
    if (onClassifyDynamic) {
      await onClassifyDynamic(value);
      return;
    }
    await classifyDynamic(candidate.id, value);
    mutate(candidateKey(candidate.id, recruitmentId));
  };

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* 1. Personal Information */}
      <CandidatePersonalInfoCard
        candidate={candidate}
        friends={friends}
        authUser={authUser}
        recruitmentId={recruitmentId}
        onToggleKnown={onToggleKnown}
        showKnownCheckbox={showKnownCheckbox}
      />

      {/* 2. Contact Information */}
      {showContactInfo && (
        <CandidateContactInfoCard
          email={candidate.email}
          phone={candidate.application?.phone}
        />
      )}

      {/* Links Information */}
      {showLinks && (
        <CandidateLinksCard
          githubUrl={candidate.application?.github}
          linkedinUrl={candidate.application?.linkedIn}
          websiteUrl={candidate.application?.personalWebsite}
        />
      )}

      {/* 3. Academic Status */}
      {showAcademicStatus && (
        <CandidateAcademicStatusCard
          course={candidate.application?.degree}
          year={candidate.application?.curricularYear}
        />
      )}

      {/* 4. Department Interests */}
      {showDepartmentInterests && (
        <CandidateDepartmentInterestsCard
          interests={candidate.application?.interests}
        />
      )}

      {/* 5. Interview and Dynamic Classification */}
      {showClassifications && (
        <CandidateClassificationsCard
          candidateId={candidate.id}
          interviewClassification={candidate.interviewClassification}
          dynamicClassification={candidate.dynamicClassification}
          onClassifyInterview={handleClassifyInterview}
          onClassifyDynamic={handleClassifyDynamic}
          readOnly={readOnly}
          readOnlyInterview={readOnlyInterview}
          readOnlyDynamic={readOnlyDynamic}
        />
      )}

      {/* 6. Result and Voting Status */}
      {showResultVoting && (
        <CandidateResultVotingCard votingDecision={candidate.votingDecision} />
      )}
    </div>
  );
}

export default CandidateModularInfo;
