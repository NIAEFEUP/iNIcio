"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
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
import { CandidateWithMetadata } from "@/lib/candidate";
import CandidateAcademicInfo from "../card/candidate-academic-info";
import CandidateDepartmentInterestInfo from "../card/candidate-department-interest-info";
import CandidateIdentityInfo from "../card/candidate-identity-info";
import Link from "next/link";
import CandidateQuickInfoSelect from "./candidate-quick-info-select";
import { ClassificationBadge } from "../candidate-classification-badge";

interface CandidateQuickInfoProps {
  candidate: CandidateWithMetadata;
  friendCheckboxActive?: boolean;
  selectActionActive?: boolean;
  selectActionHandler?: (
    checked: boolean,
    candidate: CandidateWithMetadata,
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
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-accent/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="relative z-10">
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
          <CandidateQuickInfoSelect
            candidate={candidate}
            selectActionHandler={selectActionHandler}
            candidateSelected={candidateSelected}
          />
        )}
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="flex flex-row justify-between">
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

        <Separator className="bg-gradient-to-r from-transparent via-border to-transparent my-4" />

        <div className="space-y-4">
          <CandidateAcademicInfo candidate={candidate} />

          <CandidateDepartmentInterestInfo candidate={candidate} />

          <SocialLinks
            githubUrl={candidate?.application?.github || null}
            linkedinUrl={candidate?.application?.linkedIn || null}
            websiteUrl={candidate?.application?.personalWebsite || null}
          />

          {(showClassifyInterview || showClassifyDynamic) && (
            <div className="flex flex-col gap-1">
              <h3 className="font-bold">Classificação</h3>
              <Select
                onValueChange={(value) => {
                  if (showClassifyInterview) {
                    addInterviewClassification(candidate.id, value);
                  }
                  if (showClassifyDynamic) {
                    addDynamicClassification(candidate.id, value);
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
      </CardContent>
      {displayAnyButton && (
        <CardFooter className="z-10 bg-gradient-to-r from-accent/20 to-accent/30 border-t border-border/50 p-6">
          <div className="flex flex-col items-center justify-center gap-1 w-full">
            {displayDynamicButton && (
              <Link
                href={`/dynamic/${candidate.dynamic?.dynamicId}`}
                target="_blank"
                className="group/footer flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 hover:bg-background transition-all duration-200 hover:shadow-md"
              >
                <span className="text-sm font-semibold text-foreground group-hover/footer:text-primary transition-colors">
                  Dinâmica
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover/footer:text-primary transition-colors" />
              </Link>
            )}

            <div className="h-4 w-px bg-border" />

            {displayInterviewButton && (
              <a
                href={`/candidate/${candidate?.id}/interview`}
                className="group/footer flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 hover:bg-background transition-all duration-200 hover:shadow-md"
              >
                <span className="text-sm font-semibold text-foreground group-hover/footer:text-primary transition-colors">
                  Entrevista
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover/footer:text-primary transition-colors" />
              </a>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
