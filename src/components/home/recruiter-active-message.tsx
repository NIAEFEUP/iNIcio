import Link from "next/link";
import { Users, Calendar, ArrowRight, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function RecruiterActiveMessage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl space-y-8">
      <div className="space-y-2">
        <Badge
          variant="secondary"
          className="gap-1.5 px-3 py-1 text-xs font-normal"
        >
          <ShieldCheck className="size-3.5 text-primary" />
          Painel do Recrutador
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Gestão do Recrutamento
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
          Tens acesso às ferramentas de avaliação e disponibilidade para o
          recrutamento atual.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Users className="size-5 text-primary" />
            </div>
            <CardTitle className="text-xl">Candidatos</CardTitle>
            <CardDescription className="text-sm">
              Consulta todas as candidaturas submetidas, CVs e comentários de
              avaliação da equipa.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              nativeButton={false}
              className="w-full gap-2"
              render={<Link href="/candidates" />}
            >
              Ver Candidatos
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Calendar className="size-5 text-primary" />
            </div>
            <CardTitle className="text-xl">Disponibilidades</CardTitle>
            <CardDescription className="text-sm">
              Define os teus horários disponíveis para entrevistas individuais e
              dinâmicas de grupo.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              nativeButton={false}
              variant="outline"
              className="w-full gap-2"
              render={<Link href="/recruiter/availability" />}
            >
              Definir Horários
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
