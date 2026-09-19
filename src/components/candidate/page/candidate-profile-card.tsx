"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Calendar, Network, SlidersHorizontal } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/utils";

import {
  ClassificationText,
  DecisionText,
} from "@/components/candidates/candidate-text";
import { CandidateWithMetadata } from "@/lib/candidate";
import { RecruiterToCandidate, User } from "@/lib/db";

interface CandidateProfileCardProps {
  candidate: CandidateWithMetadata;
  friends?: Array<RecruiterToCandidate>;
  authUser?: User | null;
  classifyInterview?: (
    candidateId: string,
    classification: string,
  ) => void | Promise<void>;
  classifyDynamic?: (
    candidateId: string,
    classification: string,
  ) => void | Promise<void>;
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="flex flex-wrap items-center justify-end gap-1">
        {children}
      </div>
    </div>
  );
}

export default function CandidateProfileCard({
  candidate,
  friends = [],
  authUser = null,
  classifyInterview,
  classifyDynamic,
}: CandidateProfileCardProps) {
  const [known, setKnown] = useState<boolean>(
    friends.some(
      (friend) =>
        friend.candidateId === candidate.id &&
        friend.recruiterId === authUser?.id,
    ),
  );

  const [interviewClassification, setInterviewClassification] = useState<
    string | null | undefined
  >(candidate.interviewClassification);

  const [dynamicClassification, setDynamicClassification] = useState<
    string | null | undefined
  >(candidate.dynamicClassification);

  const toggleKnown = async () => {
    setKnown((prev) => !prev);
    const result = await fetch("/api/friends", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: candidate.id }),
    });
    if (!result.ok) setKnown((prev) => !prev);
  };

  const interests = candidate.application?.interests ?? [];
  const course = candidate.application?.degree;
  const year = candidate.application?.curricularYear;
  const picture =
    candidate.application?.profilePicture || candidate.image || undefined;
  const metaLines = [
    candidate.application?.studentNumber
      ? `nº ${candidate.application.studentNumber}`
      : null,
    candidate.application?.phone,
    candidate.email,
  ].filter(Boolean);

  return (
    <div className="relative flex flex-col justify-between rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar className="size-16 shrink-0 ring-2 ring-border/60">
            <AvatarImage
              src={picture}
              alt={candidate.name || "Candidato"}
              className="object-cover"
            />
            <AvatarFallback>
              <InitialsAvatar
                className="size-full rounded-full text-base font-bold"
                initials={getInitials(candidate.name)}
              />
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground truncate">
              {classifyInterview ? (
                <Link
                  href={`/candidate/${candidate.id}`}
                  target="_blank"
                  className="hover:text-primary transition-colors"
                  title="Ver perfil do candidato"
                >
                  {candidate.name || "Sem nome"}
                </Link>
              ) : (
                candidate.name || "Sem nome"
              )}
            </h2>
            <div className="flex flex-col gap-0.5">
              {metaLines.map((line, idx) => (
                <p
                  key={idx}
                  className="text-[11px] text-muted-foreground truncate"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t pt-3 text-xs">
        <InfoRow icon={<Building2 className="size-3.5" />} label="Curso">
          <span className="font-medium uppercase">{course || "-"}</span>
        </InfoRow>
        <InfoRow icon={<Calendar className="size-3.5" />} label="Ano">
          <span className="font-medium">
            {year
              ? /^\d+$/.test(String(year))
                ? `${year}º ano`
                : String(year)
              : "-"}
          </span>
        </InfoRow>
        {!classifyInterview && (
          <InfoRow
            icon={<SlidersHorizontal className="size-3.5" />}
            label="Classificação da entrevista"
          >
            <ClassificationText level={interviewClassification} />
          </InfoRow>
        )}
        {(candidate.dynamic ||
          (dynamicClassification && dynamicClassification !== "none") ||
          classifyDynamic) && (
          <InfoRow
            icon={<SlidersHorizontal className="size-3.5" />}
            label="Classificação da dinâmica"
          >
            {classifyDynamic ? (
              <Select
                value={
                  dynamicClassification && dynamicClassification !== "none"
                    ? dynamicClassification
                    : ""
                }
                onValueChange={(val) => {
                  setDynamicClassification(val);
                  classifyDynamic(candidate.id, val);
                }}
              >
                <SelectTrigger className="h-7 w-28 text-xs font-medium">
                  <SelectValue placeholder="Classificar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="muito fraco">Muito fraco</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="muito forte">Muito forte</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <ClassificationText level={dynamicClassification} />
            )}
          </InfoRow>
        )}
        {interests.length > 0 && (
          <InfoRow
            icon={<Network className="size-3.5" />}
            label="Departamentos"
          >
            {interests.map((i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {i}
              </Badge>
            ))}
          </InfoRow>
        )}
      </div>

      {classifyInterview ? (
        <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
          <span className="text-xs font-medium text-foreground">
            Classificação da entrevista
          </span>
          <Select
            value={
              interviewClassification && interviewClassification !== "none"
                ? interviewClassification
                : ""
            }
            onValueChange={(val) => {
              setInterviewClassification(val);
              classifyInterview(candidate.id, val);
            }}
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
        </div>
      ) : (
        <div className="mt-4 flex w-full items-center justify-between gap-2 border-t pt-3">
          <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs">
            <Checkbox
              checked={known}
              onCheckedChange={toggleKnown}
              className="h-4 w-4 border-2 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            Conheço
          </label>
          <DecisionText decision={candidate.votingDecision?.decision ?? null} />
        </div>
      )}
    </div>
  );
}
