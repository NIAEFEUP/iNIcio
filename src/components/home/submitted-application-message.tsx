"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SubmittedApplicationMessage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-2xl text-center">
      <div className="flex flex-col items-center space-y-6">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="size-8 text-primary" />
        </div>

        <div className="space-y-2">
          <Badge variant="secondary" className="font-normal text-xs mb-2">
            Candidatura Registada
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            A tua candidatura está a caminho!
          </h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Obrigado pelo teu interesse no NIAEFEUP. Podes acompanhar o estado
            atual, agendamentos de entrevistas ou dinâmicas e o teu resultado
            diretamente na plataforma.
          </p>
        </div>

        <Card className="w-full text-left">
          <CardHeader>
            <CardTitle className="text-base">Próximos Passos</CardTitle>
            <CardDescription className="text-sm">
              Consulta o teu percurso de recrutamento para veres o estado das
              etapas e eventuais marcações pendentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              size="lg"
              className="w-full gap-2"
              render={<Link href="/candidate/progress" />}
            >
              Ver o meu Progresso
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
