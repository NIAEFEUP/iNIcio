"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink, History } from "lucide-react";

import { CandidateAvatarLightbox } from "@/components/candidates/candidate-avatar-lightbox";
import { ClassificationText } from "@/components/candidates/candidate-text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { classifyDynamic } from "@/app/candidate/actions";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { getInitials, cn } from "@/lib/utils";

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

export interface DynamicCandidateCardProps {
  candidate: {
    id: string;
    name?: string | null;
    image?: string | null;
    previousApplicationYears?: Array<string | number>;
    application?: {
      studentNumber?: string | number | null;
      degree?: string | null;
      curricularYear?: string | number | null;
    } | null;
    interviewClassification?: string | null;
    dynamicClassification?: string | null;
  };
  candidateCount?: number;
  onClassifyDynamic?: (value: string) => Promise<void> | void;
  readOnly?: boolean;
  className?: string;
}

export function DynamicCandidateCard({
  candidate,
  candidateCount,
  onClassifyDynamic,
  readOnly = false,
  className,
}: DynamicCandidateCardProps) {
  const [dynamicClassification, setDynamicClassification] = useSyncedState<
    string | null | undefined
  >(candidate.dynamicClassification);

  const handleDynamicClassification = async (value: string) => {
    const previous = dynamicClassification;
    setDynamicClassification(value);
    try {
      if (onClassifyDynamic) {
        await onClassifyDynamic(value);
      } else {
        await classifyDynamic(candidate.id, value);
      }
    } catch (err) {
      console.error(err);
      setDynamicClassification(previous);
    }
  };

  const picture = getStableImageUrl(candidate.image);
  const name = candidate.name || "Candidato";
  const initials = React.useMemo(() => getInitials(name), [name]);
  const studentNumber = candidate.application?.studentNumber;
  const course = candidate.application?.degree;
  const rawYear = candidate.application?.curricularYear;
  const formattedYear = rawYear
    ? /^\d+$/.test(String(rawYear))
      ? `${rawYear}º ano`
      : String(rawYear)
    : null;
  const previousApplicationYears = candidate.previousApplicationYears ?? [];

  const isLarge = candidateCount !== undefined && candidateCount <= 2;
  const isMedium = candidateCount === 3;
  const isSmall = candidateCount === 4;
  const isUltraSmall = candidateCount !== undefined && candidateCount >= 5;

  const avatarSize = isLarge
    ? "lg"
    : isMedium
      ? "default"
      : isSmall
        ? "md"
        : "lg";

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border/70 bg-card shadow-xs transition-all hover:border-border hover:shadow-sm flex flex-col justify-between lg:flex-1 lg:min-h-0",
        isLarge
          ? "p-4 min-h-[140px]"
          : isMedium
            ? "p-3.5 min-h-[120px]"
            : isSmall
              ? "p-3 min-h-[105px]"
              : "p-2.5 min-h-[90px]",
        className,
      )}
    >
      {/* Top section: Avatar, Name, Academic Info (displayed only once) */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0">
          <CandidateAvatarLightbox
            picture={picture}
            name={name}
            initials={initials}
            size={avatarSize}
            avatarClassName={isUltraSmall ? "size-18" : undefined}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                href={`/candidate/${candidate.id}`}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "font-semibold text-foreground hover:underline truncate",
                  isLarge
                    ? "text-base sm:text-lg font-bold"
                    : isMedium
                      ? "text-sm sm:text-base font-semibold"
                      : isUltraSmall
                        ? "text-base sm:text-lg font-bold"
                        : "text-xs sm:text-sm font-semibold",
                )}
                title={name}
              >
                {name}
              </Link>
              {previousApplicationYears.length > 0 && (
                <Tooltip>
                  <TooltipTrigger className="inline-flex shrink-0 cursor-help items-center text-muted-foreground hover:text-foreground">
                    <History className={cn(isLarge ? "size-4" : "size-3.5")} />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Candidatou-se anteriormente em{" "}
                    {previousApplicationYears.join(", ")}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            <Link
              href={`/candidate/${candidate.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground/50 hover:text-foreground shrink-0 p-0.5 rounded transition-colors"
              title="Abrir perfil noutro separador"
            >
              <ExternalLink className={cn(isLarge ? "size-3.5" : "size-3")} />
            </Link>
          </div>

          <div
            className={cn(
              "flex items-center gap-1.5 text-muted-foreground truncate",
              isLarge || isMedium ? "text-xs" : "text-[11px]",
            )}
          >
            {studentNumber && (
              <span className="font-mono text-muted-foreground/90">
                {studentNumber}
              </span>
            )}
            {studentNumber && (course || formattedYear) && <span>•</span>}
            {course && (
              <span className="font-medium uppercase text-muted-foreground/90">
                {course}
              </span>
            )}
            {course && formattedYear && <span>•</span>}
            {formattedYear && <span>{formattedYear}</span>}
            {!studentNumber && !course && !formattedYear && (
              <span>Sem dados académicos</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom section: Classifications (Interview & Dynamic) */}
      <div
        className={cn(
          "mt-auto border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs",
          isLarge ? "pt-3" : isUltraSmall ? "pt-1.5" : "pt-2",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              "font-medium text-muted-foreground shrink-0",
              isLarge || isMedium ? "text-xs" : "text-[11px]",
            )}
          >
            Entrevista:
          </span>
          <ClassificationText
            level={candidate.interviewClassification}
            className="text-xs font-semibold truncate"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              "font-medium text-muted-foreground",
              isLarge || isMedium ? "text-xs" : "text-[11px]",
            )}
          >
            Dinâmica:
          </span>
          <Select
            value={
              dynamicClassification && dynamicClassification !== "none"
                ? dynamicClassification
                : ""
            }
            onValueChange={handleDynamicClassification}
            disabled={readOnly}
          >
            <SelectTrigger
              size="sm"
              className={cn(
                "h-7 w-28 text-xs font-medium px-2 transition-colors",
                dynamicClassification === "muito forte" &&
                  "text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/5",
                dynamicClassification === "muito fraco" &&
                  "text-rose-600 dark:text-rose-400 border-rose-500/40 bg-rose-500/5",
                dynamicClassification === "normal" &&
                  "text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/5",
              )}
            >
              <SelectValue placeholder="Classificar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="muito fraco">Muito fraco</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="muito forte">Muito forte</SelectItem>
              <SelectItem value="none">Limpar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export default DynamicCandidateCard;
