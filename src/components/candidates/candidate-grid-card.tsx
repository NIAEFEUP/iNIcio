"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Calendar, Network, SlidersHorizontal } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { GridCard } from "@/components/data-table/grid-card";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import { getInitials } from "@/lib/utils";
import { CandidateWithMetadata } from "@/lib/candidate";
import { RecruiterToCandidate, User } from "@/lib/db";
import { ClassificationText, DecisionText } from "./candidate-text";

interface CandidateGridCardProps {
  candidate: CandidateWithMetadata;
  friends?: Array<RecruiterToCandidate>;
  authUser?: User | null;
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

export default function CandidateGridCard({
  candidate,
  friends = [],
  authUser = null,
}: CandidateGridCardProps) {
  const [known, setKnown] = useState<boolean>(
    friends.some(
      (friend) =>
        friend.candidateId === candidate.id &&
        friend.recruiterId === authUser?.id,
    ),
  );

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

  return (
    <GridCard
      avatar={
        <Avatar className="size-14 shrink-0 ring-2 ring-border/60">
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
      }
      title={
        <Link
          href={`/candidate/${candidate.id}`}
          className="transition-colors hover:text-primary"
        >
          {candidate.name || "Sem nome"}
        </Link>
      }
      subtitle={
        candidate.application?.studentNumber
          ? `nº ${candidate.application.studentNumber}`
          : undefined
      }
      actions={
        <div className="flex w-full items-center justify-between gap-2">
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
      }
    >
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
      <InfoRow
        icon={<SlidersHorizontal className="size-3.5" />}
        label="Entrevista"
      >
        <ClassificationText level={candidate.interviewClassification} />
      </InfoRow>
      <InfoRow
        icon={<SlidersHorizontal className="size-3.5" />}
        label="Dinâmica"
      >
        <ClassificationText level={candidate.dynamicClassification} />
      </InfoRow>
      {interests.length > 0 && (
        <InfoRow icon={<Network className="size-3.5" />} label="Departamentos">
          {interests.map((i) => (
            <Badge key={i} variant="secondary" className="text-[10px]">
              {i}
            </Badge>
          ))}
        </InfoRow>
      )}
    </GridCard>
  );
}
