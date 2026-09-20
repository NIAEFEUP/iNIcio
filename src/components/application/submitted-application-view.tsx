import Link from "next/link";
import {
  FileText,
  ExternalLink,
  Globe,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Application } from "@/lib/db";
import type { UserApplicationWithRecruitment } from "@/lib/application";

interface SubmittedApplicationViewProps {
  application: Application;
  interests: string[];
  user: {
    name: string;
    email: string;
  };
  isCurrent?: boolean;
  userApplications?: UserApplicationWithRecruitment[];
  recruitmentTitle?: string;
}

export default function SubmittedApplicationView({
  application,
  interests,
  user,
  recruitmentTitle,
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
      <div className="flex items-center justify-between">
        <Link
          href="/application"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 text-muted-foreground hover:text-foreground text-xs",
          )}
        >
          <ArrowLeft className="size-3.5" />
          Todas as Candidaturas
        </Link>

        <Link
          href={`/candidate/result?recruitmentId=${application.recruitmentId}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 text-muted-foreground hover:text-foreground text-xs",
          )}
        >
          <Sparkles className="size-3.5 text-primary" />
          Ver Resultado
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-3 text-center">
        {recruitmentTitle && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            {recruitmentTitle}
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Submetido a {formattedDate}
          </p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            A tua Candidatura.
          </h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Aqui podes rever todos os dados e respostas que submeteste à equipa
            de recrutamento.
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 space-y-8 shadow-xs">
        {/* Personal Details */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Informações Pessoais
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 p-3.5 rounded-xl bg-muted/40">
              <span className="text-xs text-muted-foreground">Nome</span>
              <p className="text-sm font-medium text-foreground">{user.name}</p>
            </div>
            <div className="space-y-1 p-3.5 rounded-xl bg-muted/40">
              <span className="text-xs text-muted-foreground">Email</span>
              <p className="text-sm font-medium text-foreground">
                {user.email}
              </p>
            </div>
            <div className="space-y-1 p-3.5 rounded-xl bg-muted/40">
              <span className="text-xs text-muted-foreground">
                Número de Estudante
              </span>
              <p className="text-sm font-medium text-foreground">
                {application.studentNumber}
              </p>
            </div>
            <div className="space-y-1 p-3.5 rounded-xl bg-muted/40">
              <span className="text-xs text-muted-foreground">Telefone</span>
              <p className="text-sm font-medium text-foreground">
                {application.phone || "Não indicado"}
              </p>
            </div>
            <div className="space-y-1 p-3.5 rounded-xl bg-muted/40">
              <span className="text-xs text-muted-foreground">Curso e Ano</span>
              <p className="text-sm font-medium text-foreground">
                {application.degree || "Não indicado"}{" "}
                {application.curricularYear
                  ? `· ${application.curricularYear}º ano`
                  : ""}
              </p>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Presença Online & CV
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {application.curriculum && (
              <a
                href={application.curriculum}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-2 text-xs",
                )}
              >
                <FileText className="size-3.5 text-primary" />
                Ver Currículo (CV)
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>
            )}
            {application.linkedIn && (
              <a
                href={application.linkedIn}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-2 text-xs",
                )}
              >
                <FaLinkedin className="size-3.5 text-blue-600" />
                LinkedIn
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>
            )}
            {application.github && (
              <a
                href={application.github}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-2 text-xs",
                )}
              >
                <FaGithub className="size-3.5" />
                GitHub
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>
            )}
            {application.personalWebsite && (
              <a
                href={application.personalWebsite}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-2 text-xs",
                )}
              >
                <Globe className="size-3.5 text-muted-foreground" />
                Website Pessoal
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>
            )}
            {!application.curriculum &&
              !application.linkedIn &&
              !application.github &&
              !application.personalWebsite && (
                <p className="text-sm text-muted-foreground italic">
                  Nenhum link ou CV fornecido.
                </p>
              )}
          </div>
        </section>

        {/* Interests */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Áreas de Interesse
          </h2>
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="px-3 py-1 text-xs font-medium"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Nenhuma área de interesse selecionada.
            </p>
          )}
        </section>

        {/* Written Answers */}
        <section className="space-y-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Respostas Submetidas
          </h2>

          <div className="space-y-4">
            {application.interestJustification && (
              <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-xs font-medium text-muted-foreground">
                  Por que razão escolheste estes departamentos?
                </span>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {application.interestJustification}
                </p>
              </div>
            )}

            {application.experience && (
              <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-xs font-medium text-muted-foreground">
                  Experiência prévia em projetos ou atividades
                </span>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {application.experience}
                </p>
              </div>
            )}

            {application.motivation && (
              <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-xs font-medium text-muted-foreground">
                  O que te motivou a candidatar ao NIAEFEUP?
                </span>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {application.motivation}
                </p>
              </div>
            )}

            {application.suggestions && (
              <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-xs font-medium text-muted-foreground">
                  Sugestões ou ideias para o NIAEFEUP
                </span>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {application.suggestions}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/application"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "gap-2",
          )}
        >
          <ArrowLeft className="size-4" />
          Ver Todas as Candidaturas
        </Link>
      </div>
    </div>
  );
}
