"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Calendar, Network } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CandidateWithMetadata } from "@/lib/candidate";
import { User } from "@/lib/db";
import { getInitials } from "@/lib/utils";

interface DynamicCandidatesCardProps {
  candidates: Array<CandidateWithMetadata>;
  addDynamicClassification: (
    candidateId: string,
    classification: string,
  ) => void;
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

function DynamicCandidateItem({
  candidate,
  addDynamicClassification,
}: {
  candidate: CandidateWithMetadata;
  addDynamicClassification: (
    candidateId: string,
    classification: string,
  ) => void;
}) {
  const [classification, setClassification] = useState<
    string | null | undefined
  >(candidate.dynamicClassification);

  const interests = candidate.application?.interests ?? [];
  const course = candidate.application?.degree;
  const year = candidate.application?.curricularYear;
  const picture =
    candidate.application?.profilePicture || candidate.image || undefined;

  return (
    <div className="relative flex flex-col justify-between rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-12 shrink-0 ring-2 ring-border/60">
            <AvatarImage
              src={picture}
              alt={candidate.name || "Candidato"}
              className="object-cover"
            />
            <AvatarFallback>
              <InitialsAvatar
                className="size-full rounded-full text-sm font-bold"
                initials={getInitials(candidate.name)}
              />
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/candidate/${candidate.id}`}
                target="_blank"
                className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary"
              >
                {candidate.name || "Sem nome"}
              </Link>
            </div>
            {candidate.application?.studentNumber && (
              <p className="truncate text-[11px] text-muted-foreground">
                nº {candidate.application.studentNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t pt-2.5 text-xs">
        <InfoRow icon={<Building2 className="size-3.5" />} label="Curso">
          <span className="font-medium uppercase text-foreground">
            {course || "-"}
          </span>
        </InfoRow>

        <InfoRow icon={<Calendar className="size-3.5" />} label="Ano">
          <span className="font-medium text-foreground">
            {year
              ? /^\d+$/.test(String(year))
                ? `${year}º ano`
                : String(year)
              : "-"}
          </span>
        </InfoRow>

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

      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2.5">
        <span className="text-xs font-medium text-foreground">
          Classificação da dinâmica
        </span>
        <Select
          value={
            classification && classification !== "none" ? classification : ""
          }
          onValueChange={(val) => {
            setClassification(val);
            addDynamicClassification(candidate.id, val);
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
    </div>
  );
}

export default function DynamicCandidatesCard({
  candidates,
  addDynamicClassification,
}: DynamicCandidatesCardProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Candidatos
      </h3>

      <div className="flex flex-col gap-4">
        {candidates.map((c) => (
          <DynamicCandidateItem
            key={c.id}
            candidate={c}
            addDynamicClassification={addDynamicClassification}
          />
        ))}
      </div>
    </div>
  );
}
