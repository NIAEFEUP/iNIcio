"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RecruiterToCandidate, User } from "@/lib/db";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SocialLinks } from "@/components/profile/social-links";
import type { CandidateListMetadata } from "@/lib/candidate";
import CandidateAcademicInfo from "../card/candidate-academic-info";
import CandidateDepartmentInterestInfo from "../card/candidate-department-interest-info";
import CandidateIdentityInfo from "../card/candidate-identity-info";
import Link from "next/link";
import CandidateQuickInfoSelect from "./candidate-quick-info-select";
import { ClassificationBadge } from "../candidate-classification-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CandidateQuickInfoProps {
  candidate: CandidateListMetadata;
  friendCheckboxActive?: boolean;
  selectActionActive?: boolean;
  selectActionHandler?: (
    checked: boolean,
    candidate: CandidateListMetadata,
  ) => void;
  candidateSelected?: boolean;
  friends?: Array<RecruiterToCandidate>;
  authUser?: User | null;
  hideInterviewButton?: boolean;
  hideDynamicButton?: boolean;
  showClassificationBadges?: boolean;
  fullDetails?: boolean;
  showClassifyInterview?: boolean;
  showClassifyDynamic?: boolean;
  addDynamicClassification?: (
    candidateId: string,
    classification: string,
  ) => void;
  addInterviewClassification?: (
    candidateId: string,
    classification: string,
  ) => void;
}

export default function CandidateQuickInfo({
  authUser = null,
  candidate,
  friendCheckboxActive = false,
  showClassificationBadges = false,
  selectActionActive = false,
  selectActionHandler = () => {},
  candidateSelected = false,
  friends = [],
  hideInterviewButton = false,
  hideDynamicButton = false,
  fullDetails = false,
  showClassifyInterview = false,
  showClassifyDynamic = false,
  addDynamicClassification = () => {},
  addInterviewClassification = () => {},
}: CandidateQuickInfoProps) {
  const [checked, setChecked] = useState<boolean>(
    friends.some(
      (friend) =>
        friend.candidateId === candidate.id &&
        friend.recruiterId === authUser?.id,
    ),
  );

  const addFriend = async () => {
    setChecked(!checked);

    const result = await fetch("/api/friends", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidateId: candidate.id,
      }),
    });

    if (!result.ok) {
      setChecked(!checked);
    }
  };

  const getClassificationPlaceholder = () => {
    if (showClassifyInterview && candidate.interviewClassification) {
      return candidate.interviewClassification;
    }
    if (showClassifyDynamic && candidate.dynamicClassification) {
      return candidate.dynamicClassification;
    }

    return "Classificação";
  };

  const displayInterviewButton = candidate?.interview && !hideInterviewButton;
  const displayDynamicButton = candidate?.dynamic && !hideDynamicButton;
  const displayAnyButton = displayInterviewButton || displayDynamicButton;

  return (
    <div className="relative flex flex-col rounded-xl border bg-card p-4 shadow-xs">
      {candidate.votingDecision && (
        <div className="absolute top-4 right-4 z-10">
          <Badge
            variant={
              candidate.votingDecision.decision === "approve"
                ? "default"
                : "destructive"
            }
            className={`text-xs font-semibold ${
              candidate.votingDecision.decision === "approve"
                ? "bg-green-600 text-white"
                : ""
            }`}
          >
            {candidate.votingDecision.decision === "approve"
              ? "✓ Aprovado"
              : "✗ Rejeitado"}
          </Badge>
        </div>
      )}

      {(friendCheckboxActive || selectActionActive) && (
        <div className="mb-4 flex items-center gap-3">
          {friendCheckboxActive && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Checkbox
                  id={`knows-candidate-${candidate.id}`}
                  className="h-5 w-5 border-2 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-200"
                  checked={checked}
                  onCheckedChange={addFriend}
                />
              </div>
              <Label
                htmlFor={`knows-candidate-${candidate.id}`}
                className="text-sm font-medium tracking-wide text-foreground/80 cursor-pointer hover:text-foreground transition-colors"
              >
                Conheço
              </Label>
            </div>
          )}

          {selectActionActive && (
            <div className="flex flex-col gap-2">
              <CandidateQuickInfoSelect
                candidate={candidate}
                selectActionHandler={selectActionHandler}
                candidateSelected={candidateSelected}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-row justify-between gap-4">
        <CandidateIdentityInfo
          candidate={candidate}
          fullDetails={fullDetails}
        />

        {showClassificationBadges && (
          <div className="flex flex-col gap-2">
            <ClassificationBadge
              label="Entrevista"
              level={candidate.interviewClassification}
            />
            <ClassificationBadge
              label="Dinâmica"
              level={candidate.dynamicClassification}
            />
          </div>
        )}
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-4">
        <CandidateAcademicInfo candidate={candidate} />

        <CandidateDepartmentInterestInfo candidate={candidate} />

        <SocialLinks
          githubUrl={candidate?.application?.github || null}
          linkedinUrl={candidate?.application?.linkedIn || null}
          websiteUrl={candidate?.application?.personalWebsite || null}
        />

        {(showClassifyInterview || showClassifyDynamic) && (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs font-semibold text-muted-foreground">
              Classificação
            </h3>
            <Select
              onValueChange={(value) => {
                if (showClassifyInterview) {
                  addInterviewClassification(candidate.id, String(value));
                }
                if (showClassifyDynamic) {
                  addDynamicClassification(candidate.id, String(value));
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={`${getClassificationPlaceholder()}`}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="muito fraco">Muito fraco</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="muito forte">Muito forte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {displayAnyButton && (
        <div className="mt-4 flex flex-col items-center gap-2 border-t pt-4">
          {displayDynamicButton && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              render={
                <Link
                  href={`/dynamic/${candidate.dynamic?.dynamicId}`}
                  target="_blank"
                />
              }
            >
              <ExternalLink />
              Dinâmica
            </Button>
          )}

          {displayDynamicButton && displayInterviewButton && (
            <div className="h-px w-full bg-border" />
          )}

          {displayInterviewButton && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              render={
                <Link
                  href={`/candidate/${candidate?.id}/interview`}
                  target="_blank"
                />
              }
            >
              <ExternalLink />
              Entrevista
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
