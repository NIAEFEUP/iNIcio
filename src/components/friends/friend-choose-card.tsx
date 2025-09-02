import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Checkbox } from "@/components/ui/checkbox";

import { Label } from "@/components/ui/label";
import { Candidate, RecruiterToCandidate } from "@/lib/db";
import { User } from "better-auth";

import Image from "next/image";

export interface FriendChooseCardProps {
  candidate: User;
  friends: Array<RecruiterToCandidate>;
}

export default function FriendChooseCard({
  candidate,
  friends,
}: FriendChooseCardProps) {
  const isFriend = friends.some(
    (friend) => friend.candidateId === candidate.id,
  );

  return (
    <Card>
      <CardHeader className="flex flex-col items-center">
        <CardTitle>{candidate.name}</CardTitle>
        <Image
          src="logo.svg"
          alt="Friend"
          width={200}
          height={200}
          className="rounded-full"
        ></Image>
      </CardHeader>
      <CardFooter>
        <div className="flex items-center gap-3">
          <Checkbox
            id={`knows-candidate-${candidate.id}`}
            className="border border-2 border-black"
            checked={isFriend}
          />
          <Label htmlFor={`knows-candidate-${candidate.id}`}>Conheço</Label>
        </div>
      </CardFooter>
    </Card>
  );
}
