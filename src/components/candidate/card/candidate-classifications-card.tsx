"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClassificationText } from "@/components/candidates/candidate-text";
import { classifyDynamic, classifyInterview } from "@/app/candidate/actions";
import { cn } from "@/lib/utils";

function useSyncedState<S>(
  value: S,
): [S, React.Dispatch<React.SetStateAction<S>>] {
  const [state, setState] = React.useState(value);
  const [previous, setPrevious] = React.useState(value);
  if (!Object.is(previous, value)) {
    setPrevious(value);
    setState(value);
  }
  return [state, setState];
}

export interface CandidateClassificationsCardProps {
  candidateId: string;
  interviewClassification?: string | null;
  dynamicClassification?: string | null;
  onClassifyInterview?: (value: string) => Promise<void> | void;
  onClassifyDynamic?: (value: string) => Promise<void> | void;
  readOnly?: boolean;
  readOnlyInterview?: boolean;
  readOnlyDynamic?: boolean;
  showInterviewClassification?: boolean;
  showDynamicClassification?: boolean;
  className?: string;
}

export function CandidateClassificationsCard({
  candidateId,
  interviewClassification: initialInterviewClassification,
  dynamicClassification: initialDynamicClassification,
  onClassifyInterview,
  onClassifyDynamic,
  readOnly = false,
  readOnlyInterview,
  readOnlyDynamic,
  showInterviewClassification = true,
  showDynamicClassification = true,
  className,
}: CandidateClassificationsCardProps) {
  const [interviewClassification, setInterviewClassification] = useSyncedState<
    string | null | undefined
  >(initialInterviewClassification);

  const [dynamicClassification, setDynamicClassification] = useSyncedState<
    string | null | undefined
  >(initialDynamicClassification);

  const handleInterviewClassification = async (value: string) => {
    const previous = interviewClassification;
    setInterviewClassification(value);
    try {
      if (onClassifyInterview) {
        await onClassifyInterview(value);
      } else {
        await classifyInterview(candidateId, value);
      }
    } catch (err) {
      console.error(err);
      setInterviewClassification(previous);
    }
  };

  const handleDynamicClassification = async (value: string) => {
    const previous = dynamicClassification;
    setDynamicClassification(value);
    try {
      if (onClassifyDynamic) {
        await onClassifyDynamic(value);
      } else {
        await classifyDynamic(candidateId, value);
      }
    } catch (err) {
      console.error(err);
      setDynamicClassification(previous);
    }
  };

  const isInterviewReadOnly =
    readOnly || (readOnlyInterview !== undefined ? readOnlyInterview : false);

  const isDynamicReadOnly =
    readOnly || (readOnlyDynamic !== undefined ? readOnlyDynamic : false);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        <span>Classificações</span>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3.5 text-xs">
        {showInterviewClassification && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground font-medium">
              Entrevista
            </span>
            {isInterviewReadOnly ? (
              <ClassificationText level={interviewClassification} />
            ) : (
              <Select
                value={
                  interviewClassification && interviewClassification !== "none"
                    ? interviewClassification
                    : ""
                }
                onValueChange={handleInterviewClassification}
              >
                <SelectTrigger className="h-8 w-32 text-xs font-medium">
                  <SelectValue placeholder="Classificar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="muito fraco">Muito fraco</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="muito forte">Muito forte</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {showDynamicClassification && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground font-medium">Dinâmica</span>
            {isDynamicReadOnly ? (
              <ClassificationText level={dynamicClassification} />
            ) : (
              <Select
                value={
                  dynamicClassification && dynamicClassification !== "none"
                    ? dynamicClassification
                    : ""
                }
                onValueChange={handleDynamicClassification}
              >
                <SelectTrigger className="h-8 w-32 text-xs font-medium">
                  <SelectValue placeholder="Classificar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="muito fraco">Muito fraco</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="muito forte">Muito forte</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidateClassificationsCard;
