"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, Calendar, Network, SlidersHorizontal } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GridCard } from "@/components/data-table/grid-card";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import { getInitials } from "@/lib/utils";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { CandidateWithMetadata } from "@/lib/candidate";
import { RecruiterToCandidate } from "@/lib/db";
import { ClassificationText, DecisionText } from "./candidate-text";

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

interface CandidateGridCardProps {
  candidate: CandidateWithMetadata;
  friends?: Array<RecruiterToCandidate>;
  authUser?: { id?: string } | null;
  showContactInfo?: boolean;
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

function ClassificationSelect({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value && value !== "none" ? value : ""}
      onValueChange={onChange}
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
  );
}

export default function CandidateGridCard({
  candidate,
  friends = [],
  authUser = null,
  showContactInfo = false,
  classifyInterview,
  classifyDynamic,
}: CandidateGridCardProps) {
  const [known, setKnown] = React.useState<boolean>(
    friends.some(
      (friend) =>
        friend.candidateId === candidate.id &&
        friend.recruiterId === authUser?.id,
    ),
  );

  const [interviewClassification, setInterviewClassification] = useSyncedState<
    string | null | undefined
  >(candidate.interviewClassification);

  const [dynamicClassification, setDynamicClassification] = useSyncedState<
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

  const handleInterviewClassification = async (value: string) => {
    if (!classifyInterview) return;
    const previous = interviewClassification;
    setInterviewClassification(value);
    try {
      await classifyInterview(candidate.id, value);
    } catch (err) {
      console.error(err);
      setInterviewClassification(previous);
    }
  };

  const handleDynamicClassification = async (value: string) => {
    if (!classifyDynamic) return;
    const previous = dynamicClassification;
    setDynamicClassification(value);
    try {
      await classifyDynamic(candidate.id, value);
    } catch (err) {
      console.error(err);
      setDynamicClassification(previous);
    }
  };

  const interests = candidate.application?.interests ?? [];
  const course = candidate.application?.degree;
  const year = candidate.application?.curricularYear;
  const picture = getStableImageUrl(candidate.image);
  const name = candidate.name || "Candidato";
  const contactLines = [
    candidate.application?.studentNumber
      ? `nº ${candidate.application.studentNumber}`
      : null,
    candidate.application?.phone,
    candidate.email,
  ].filter(Boolean) as Array<string>;

  const avatar = (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="cursor-pointer rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Ver foto de ${name}`}
          >
            <Avatar className="size-14 shrink-0 ring-2 ring-border/60">
              <AvatarImage src={picture} alt={name} className="object-cover" />
              <AvatarFallback>
                <InitialsAvatar
                  className="size-full rounded-full text-base font-bold"
                  initials={getInitials(candidate.name)}
                />
              </AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DialogContent className="w-fit max-w-[min(90vw,28rem)] bg-transparent p-2 ring-0 sm:max-w-none">
        <DialogTitle className="sr-only">Foto de {name}</DialogTitle>
        <Avatar className="size-64 sm:size-80 shrink-0">
          <AvatarImage src={picture} alt={name} className="object-cover" />
          <AvatarFallback>
            <InitialsAvatar
              className="size-full rounded-full text-4xl font-bold"
              initials={getInitials(candidate.name)}
            />
          </AvatarFallback>
        </Avatar>
      </DialogContent>
    </Dialog>
  );

  return (
    <GridCard
      avatar={avatar}
      title={
        <Link
          href={`/candidate/${candidate.id}`}
          className="transition-colors hover:text-primary"
        >
          {candidate.name || "Sem nome"}
        </Link>
      }
      subtitle={
        showContactInfo && contactLines.length > 0 ? (
          <span className="flex flex-col gap-0.5">
            {contactLines.map((line, idx) => (
              <span key={idx} className="block truncate">
                {line}
              </span>
            ))}
          </span>
        ) : candidate.application?.studentNumber ? (
          `nº ${candidate.application.studentNumber}`
        ) : (
          "\u00A0"
        )
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
        {classifyInterview ? (
          <ClassificationSelect
            value={interviewClassification}
            onChange={handleInterviewClassification}
          />
        ) : (
          <ClassificationText level={interviewClassification} />
        )}
      </InfoRow>
      <InfoRow
        icon={<SlidersHorizontal className="size-3.5" />}
        label="Dinâmica"
      >
        {classifyDynamic ? (
          <ClassificationSelect
            value={dynamicClassification}
            onChange={handleDynamicClassification}
          />
        ) : (
          <ClassificationText level={dynamicClassification} />
        )}
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
