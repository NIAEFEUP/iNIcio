import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  ExternalLink,
  Globe,
  ArrowLeft,
  Calendar,
  User,
  Heart,
  Briefcase,
} from "lucide-react";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Application } from "@/lib/db";

interface SubmittedApplicationViewProps {
  application: Application;
  interests: string[];
  user: {
    name: string;
    email: string;
  };
}

export default function SubmittedApplicationView({
  application,
  interests,
  user,
}: SubmittedApplicationViewProps) {
  const formattedDate = application.submittedAt
    ? new Date(application.submittedAt).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Data indisponível";

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/candidate/progress"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-2 text-muted-foreground hover:text-foreground -ml-2",
          )}
        >
          <ArrowLeft className="size-4" />
          Voltar ao Progresso
        </Link>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Calendar className="size-3.5" />
          Submetido a {formattedDate}
        </span>
      </div>

      {/* Confirmation Banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="size-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground">
              A tua Candidatura foi Recebida
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              A equipa de recrutamento está a rever as tuas respostas. Abaixo
              podes consultar todos os dados submetidos.
            </p>
          </div>
        </div>

        <Link
          href="/candidate/progress"
          className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
        >
          Ver Fases de Seleção
        </Link>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & Academic Data */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="size-4 text-primary" />
              Identificação & Contactos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground text-xs">Nome</span>
              <span className="col-span-2 font-medium text-foreground truncate">
                {user.name}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground text-xs">Email</span>
              <span className="col-span-2 font-medium text-foreground truncate">
                {user.email}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground text-xs">
                Nº Estudante
              </span>
              <span className="col-span-2 font-medium text-foreground">
                {application.studentNumber}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground text-xs">Curso</span>
              <span className="col-span-2 font-medium text-foreground">
                {application.degree || "Não indicado"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground text-xs">
                Ano Curricular
              </span>
              <span className="col-span-2 font-medium text-foreground">
                {application.curricularYear
                  ? `${application.curricularYear}º Ano`
                  : "Não indicado"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 py-1.5">
              <span className="text-muted-foreground text-xs">Telemóvel</span>
              <span className="col-span-2 font-medium text-foreground">
                {application.phone || "Não indicado"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Links and CV */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Documentos & Perfis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block mb-1.5">
                Currículo Vitae (PDF)
              </span>
              {application.curriculum ? (
                <a
                  href={application.curriculum}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full justify-between gap-2 text-xs",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="size-3.5 text-primary" />
                    Abrir Currículo Submetido
                  </span>
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                </a>
              ) : (
                <span className="text-muted-foreground italic text-xs">
                  Nenhum ficheiro associado
                </span>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs text-muted-foreground block">
                Presença Online
              </span>

              {application.linkedIn ? (
                <a
                  href={
                    application.linkedIn.startsWith("http")
                      ? application.linkedIn
                      : `https://${application.linkedIn}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors text-xs text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <FaLinkedin className="size-3.5 text-blue-600" />
                    LinkedIn
                  </span>
                  <ExternalLink className="size-3 text-muted-foreground" />
                </a>
              ) : null}

              {application.github ? (
                <a
                  href={
                    application.github.startsWith("http")
                      ? application.github
                      : `https://${application.github}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors text-xs text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <FaGithub className="size-3.5" />
                    GitHub
                  </span>
                  <ExternalLink className="size-3 text-muted-foreground" />
                </a>
              ) : null}

              {application.personalWebsite ? (
                <a
                  href={
                    application.personalWebsite.startsWith("http")
                      ? application.personalWebsite
                      : `https://${application.personalWebsite}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors text-xs text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="size-3.5 text-emerald-500" />
                    Website Pessoal / Portfólio
                  </span>
                  <ExternalLink className="size-3 text-muted-foreground" />
                </a>
              ) : null}

              {!application.linkedIn &&
                !application.github &&
                !application.personalWebsite && (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhum link externo fornecido
                  </p>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interests Section */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Heart className="size-4 text-primary" />
            Áreas de Interesse Selecionadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Nenhuma equipa selecionada especificamente
            </p>
          )}

          {application.interestJustification && (
            <div className="pt-2 border-t border-border/50 space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Justificação de Interesses
              </span>
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {application.interestJustification}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Motivation and Experience */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Briefcase className="size-4 text-primary" />
            Percurso & Motivação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {application.experience && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Experiência Prévia e Projetos
              </span>
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {application.experience}
              </p>
            </div>
          )}

          {application.motivation && (
            <div className="space-y-1.5 pt-3 border-t border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Porquê o NIAEFEUP?
              </span>
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {application.motivation}
              </p>
            </div>
          )}

          {application.selfPromotion && (
            <div className="space-y-1.5 pt-3 border-t border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                O que podes trazer à equipa?
              </span>
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {application.selfPromotion}
              </p>
            </div>
          )}

          {application.suggestions && (
            <div className="space-y-1.5 pt-3 border-t border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sugestões ou Comentários
              </span>
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {application.suggestions}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
