"use client";

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { Checkbox } from "@/components/ui/checkbox";

import { Label } from "@/components/ui/label";
import { Candidate, RecruiterToCandidate } from "@/lib/db";
import { User } from "better-auth";

import Image from "next/image";
import Link from "next/link";
import { startTransition, use, useOptimistic, useState } from "react";

export interface FriendChooseCardProps {
  candidate: User;
  friends: Array<RecruiterToCandidate>;
}

export default function CandidateCard({
  candidate,
  friends,
}: FriendChooseCardProps) {
  const isFriend = friends.some(
    (friend) => friend.candidateId === candidate.id,
  );

  const [checked, setChecked] = useState(isFriend);

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
    <Card>
      <CardHeader className="flex flex-col items-center gap-4">
        <CardTitle>
          <Link href={`/candidate/${candidate.id}`} className="hover:underline">
            {candidate.name}
          </Link>
        </CardTitle>
        <img
          src={`${candidate.image}`}
          alt="Friend"
          width={200}
          height={200}
          className="rounded-full"
        ></img>
      </CardHeader>
      <CardFooter>
        <div className="flex items-center gap-3">
          <Checkbox
            id={`knows-candidate-${candidate.id}`}
            className="border border-2 border-black"
            checked={checked}
            onCheckedChange={addFriend}
          />
          <Label htmlFor={`knows-candidate-${candidate.id}`}>Conheço</Label>
        </div>
      </CardFooter>
    </Card>
  );
}
