import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Candidate, User } from "@/lib/db";
import Link from "next/link";

interface CandidateQuickInfoProps {
  candidate: User;
}

export default function CandidateQuickInfo({
  candidate,
}: CandidateQuickInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Tomás Palma</CardTitle>
        <CardDescription>
          <img src="https://picsum.photos/200" alt="Picture of the author" />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-row gap-2">
          <p className="font-bold">Curso:</p>
          <p>LEIC</p>
        </div>
        <div className="flex flex-row gap-2">
          <p className="font-bold">Ano</p>
          <p>3º Ano</p>
        </div>
      </CardContent>
      <CardFooter className="text-sm flex flex-row gap-2">
        <Link href="/perfil">Dinâmica</Link>
        <Link href="/perfil">Entrevista</Link>
      </CardFooter>
    </Card>
  );
}
