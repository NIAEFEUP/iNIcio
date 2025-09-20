"use client";

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Application, User } from "@/lib/db";
import Link from "next/link";

interface CandidateQuickInfoProps {
  candidate: User;
  application: Application | null;
  applicationInterests: string[];
}

export default function CandidateQuickInfo({
  candidate,
  application,
  applicationInterests,
}: CandidateQuickInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{candidate.name}</CardTitle>
        <CardDescription>
          <img src="https://picsum.photos/200" alt="Picture of the author" />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-row gap-2">
          <p className="font-bold">Curso:</p>
          <p className="uppercase">{application?.degree}</p>
        </div>
        <div className="flex flex-row gap-2">
          <p className="font-bold">Ano:</p>
          <p>{application?.curricularYear}</p>
        </div>
        <div className="flex flex-col">
          <p className="font-bold">Departamentos:</p>
          <div className="flex flex-row flex-wrap">
            {applicationInterests?.map((interest) => (
              <Badge key={crypto.randomUUID()}>{interest}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-sm flex flex-row gap-2">
        <Link href="/perfil">Dinâmica</Link>
        <Link href="/perfil">Entrevista</Link>
      </CardFooter>
    </Card>
  );
}
