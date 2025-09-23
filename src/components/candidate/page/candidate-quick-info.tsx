import { Badge } from "@/components/ui/badge";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
import { Separator } from "@/components/ui/separator";
import { Building2, Calendar, PersonStanding } from "lucide-react";
import { getCandidateDynamic } from "@/lib/dynamic";

interface CandidateQuickInfoProps {
  candidate: User;
  application: Application | null;
  applicationInterests: string[];
}

export default async function CandidateQuickInfo({
  candidate,
  application,
  applicationInterests,
}: CandidateQuickInfoProps) {
  const dynamic = await getCandidateDynamic(candidate.id);

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={"" || "/placeholder.svg"} alt={candidate?.name} />
            <AvatarFallback>{candidate?.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{candidate?.name}</h3>
            <p className="text-muted-foreground">Candidato</p>
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
