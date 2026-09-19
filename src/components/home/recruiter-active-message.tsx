import Link from "next/link";
import { Users, Calendar, ArrowRight, ShieldCheck } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function RecruiterActiveMessage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl text-center">
      <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto">
        <Badge
          variant="secondary"
          className="gap-1.5 py-1 px-3 text-xs font-medium"
        >
          <ShieldCheck className="size-3.5 text-primary" />
          Área de Recrutador
        </Badge>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground text-balance">
          Bem-vindo à Gestão do Recrutamento
        </h1>

        <p className="text-base md:text-lg text-muted-foreground text-pretty max-w-xl mx-auto leading-relaxed">
          Podes consultar os candidatos inscritos, avaliar submissões e gerir os
          teus horários de disponibilidade.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12 text-left">
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
