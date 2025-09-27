"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type {
  Application,
  Dynamic,
  RecruiterToCandidate,
  User,
} from "@/lib/db";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Building2, Calendar, Heart, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CandidateQuickInfoProps {
  candidate: User;
  application: Application | null;
  applicationInterests: string[];
  dynamic: Dynamic | null;
  friendCheckboxActive?: boolean;
  friends?: Array<RecruiterToCandidate>;
}

export default function CandidateQuickInfo({
  candidate,
  application,
  applicationInterests,
  dynamic,
  friendCheckboxActive = false,
  friends = [],
}: CandidateQuickInfoProps) {
  const isFriend = friends.some(
    (friend) => friend.candidateId === candidate.id,
  );

  const [checked, setChecked] = useState<boolean>(isFriend);

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

  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-accent/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {friendCheckboxActive && (
        <CardHeader className="relative z-10 pb-4">
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
            {checked && (
              <Heart className="h-4 w-4 text-primary fill-primary animate-pulse" />
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className="relative z-10 space-y-6 p-8">
        <div className="flex items-start gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-4 ring-primary/10 ring-offset-4 ring-offset-background transition-all duration-300 group-hover:ring-primary/20">
              <AvatarImage
                src={application?.profilePicture || "/placeholder.svg"}
                alt={candidate?.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xl font-semibold">
                {candidate?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-3 border-background shadow-sm" />
          </div>

          <div className="flex-1 min-w-0">
            <Link
              href={`/candidate/${candidate?.id}`}
              className="group/link inline-block"
            >
              <h3 className="text-2xl font-bold tracking-tight text-foreground group-hover/link:text-primary transition-colors duration-200 text-balance">
                {candidate?.name}
              </h3>
              <div className="h-0.5 w-0 bg-primary group-hover/link:w-full transition-all duration-300 mt-1" />
            </Link>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Candidato
            </p>
          </div>
        </div>

        <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Academic Information */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors duration-200">
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Curso
                </p>
                <p className="text-sm font-bold text-foreground truncate">
                  {application?.degree || "mesw"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors duration-200">
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ano
                </p>
                <p className="text-sm font-bold text-foreground truncate">
                  {application?.curricularYear || "3bsc"}
                </p>
              </div>
            </div>
          </div>

          {/* Departments */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Departamentos
            </p>
            <div className="flex flex-wrap gap-2">
              {(applicationInterests?.length > 0
                ? applicationInterests
                : ["projetos", "sinf"]
              ).map((interest, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium text-xs tracking-wide hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-default"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="z-10 bg-gradient-to-r from-accent/20 to-accent/30 border-t border-border/50 p-6">
        <div className="flex items-center justify-center gap-6 w-full">
          {dynamic && (
            <Link
              href={`/dynamic/${dynamic?.id}`}
              className="group/footer flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 hover:bg-background transition-all duration-200 hover:shadow-md"
            >
              <span className="text-sm font-semibold text-foreground group-hover/footer:text-primary transition-colors">
                Dinâmica
              </span>
              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover/footer:text-primary transition-colors" />
            </Link>
          )}

          <div className="h-4 w-px bg-border" />

          <Link
            href={`/candidate/${candidate?.id}/interview`}
            className="group/footer flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 hover:bg-background transition-all duration-200 hover:shadow-md"
          >
            <span className="text-sm font-semibold text-foreground group-hover/footer:text-primary transition-colors">
              Entrevista
            </span>
            <ExternalLink className="h-3 w-3 text-muted-foreground group-hover/footer:text-primary transition-colors" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
