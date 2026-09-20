"use client";

import Link from "next/link";
import {
  Sparkles,
  Code2,
  Users,
  Rocket,
  ArrowRight,
  Calendar,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SubmittedApplicationMessage from "./submitted-application-message";
import { User } from "@/lib/db";

interface RecruitmentActiveMessageProps {
  user: User | null;
  /** Formatted deadline of the application phase, if it has one. */
  applicationDeadline?: string | null;
}

export default function RecruitmentActiveMessage({
  user,
  applicationDeadline,
}: RecruitmentActiveMessageProps) {
  if (user) {
    return <SubmittedApplicationMessage />;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16 max-w-7xl">
      {/* Hero section */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
        <Badge
          variant="outline"
          className="gap-1.5 py-1 px-3 text-xs font-medium"
        >
          <Sparkles className="size-3.5 text-primary" />
          Recrutamento Aberto
        </Badge>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance">
          Queres fazer parte do <span className="text-primary">NIAEFEUP</span>?
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl leading-relaxed">
          Junta-te à comunidade de estudantes de informática da FEUP.
          Conecta-te, cria projetos com impacto e cresce com uma equipa
          acolhedora.
        </p>

        {applicationDeadline && (
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground pt-1">
            <Calendar className="size-4 text-primary" />
            <span>
              Candidaturas abertas até{" "}
              <strong className="text-foreground font-semibold">
                {applicationDeadline}
              </strong>
            </span>
          </div>
        )}

        {/* Hero Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full sm:w-auto justify-center">
          <Button size="lg" className="gap-2" render={<Link href="/signup" />}>
            Candidatar Agora
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline" size="lg" render={<Link href="/login" />}>
            Já tenho conta
          </Button>
        </div>
      </div>

      {/* Quick steps / expectations */}
      <div className="mt-16 pt-8 border-t border-border/60">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            O que é o NIAEFEUP?
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Mais do que um núcleo, somos um espaço de aprendizagem e partilha.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Code2 className="size-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Projetos com Impacto</CardTitle>
              <CardDescription>
                Desenvolve plataformas e ferramentas que milhares de estudantes
                da faculdade utilizam todos os dias.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Users className="size-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Comunidade & Convívio</CardTitle>
              <CardDescription>
                Encontra pessoas com os mesmos interesses que tu, partilha
                dúvidas e faz amizades para a vida académica.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Rocket className="size-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Workshops & Eventos</CardTitle>
              <CardDescription>
                Aprende ferramentas de mercado, organiza hackathons, talks e
                eventos tecnológicos abertos à faculdade.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* How application works */}
      <div className="mt-12">
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">
              Como funciona a candidatura?
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              O processo é simples e pensado para que te sintas confortável.
              Depois de criares conta, terás acesso ao formulário com perguntas
              sobre as tuas motivações e interesses. Acompanharás todas as
              novidades e agendamentos diretamente nesta plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/signup" />}
            >
              Criar conta e iniciar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
