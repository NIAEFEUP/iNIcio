"use client";

import { Badge } from "@/components/ui/badge";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Application, Dynamic, RecruiterToCandidate, User } from "@/lib/db";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Building2, Calendar } from "lucide-react";
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

  console.log("INTERESTS: ", applicationInterests);

  return (
    <Card>
      {friendCheckboxActive && (
        <CardHeader className="flex flex-row items-center">
          <Checkbox
            id={`knows-candidate-${candidate.id}`}
            className="border border-2 border-black"
            checked={checked}
            onCheckedChange={addFriend}
          />
          <Label htmlFor={`knows-candidate-${candidate.id}`}>Conheço</Label>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={candidate?.image || "/placeholder.svg"}
              alt={candidate?.name}
            />
            <AvatarFallback>{candidate?.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <Link href={`/candidate/${candidate?.id}`}>
              <h3 className="text-xl font-semibold">{candidate?.name}</h3>
            </Link>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Curso:</span>
            <span className="text-sm text-muted-foreground">
              {application?.degree}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Ano:</span>
            <span className="text-sm text-muted-foreground">
              {application?.curricularYear}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Departamentos:</span>
            <div className="flex flex-wrap gap-2">
              {applicationInterests?.map((interest) => (
                <Badge key={crypto.randomUUID()}>{interest}</Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-sm flex flex-row gap-2 items-center justify-center">
        <Link href={`/dynamic/${dynamic?.id}`}>Dinâmica</Link>
        <Link href={`/candidate/${candidate?.id}/interview`}>Entrevista</Link>
      </CardFooter>
    </Card>
  );
}
