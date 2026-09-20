import Link from "next/link";
import { FileText, ExternalLink, Globe, ArrowLeft } from "lucide-react";
import { FaLinkedin, FaGithub } from "react-icons/fa";
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
      {/* Navigation & Header */}
      <div className="space-y-4 text-center">
        <Link
          href="/candidate/progress"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 text-muted-foreground hover:text-foreground text-xs mx-auto",
          )}
        >
          <ArrowLeft className="size-3.5" />
          Voltar ao Progresso
        </Link>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
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

      {/* Structured Details */}
      <div className="space-y-10">
        {/* Personal info */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            Identificação e Contactos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Nome</span>
              <span className="font-semibold text-foreground">{user.name}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Email</span>
              <span className="font-semibold text-foreground">
                {user.email}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                Número de Estudante
              </span>
              <span className="font-semibold text-foreground">
                {application.studentNumber}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Curso</span>
              <span className="font-semibold text-foreground">
                {application.degree || "Não indicado"}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                Ano Curricular
              </span>
              <span className="font-semibold text-foreground">
                {application.curricularYear
                  ? `${application.curricularYear}º Ano`
                  : "Não indicado"}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                Telemóvel
              </span>
              <span className="font-semibold text-foreground">
                {application.phone || "Não indicado"}
              </span>
            </div>
          </div>
        </section>

        {/* CV and Profiles */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            Documentos e Ligações
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            {application.curriculum ? (
              <a
                href={application.curriculum}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-2 text-xs",
                )}
              >
                <FileText className="size-3.5" />
                Ver Currículo (PDF)
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>
            ) : null}

            {application.linkedIn && (
              <a
                href={application.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "gap-2 text-xs",
                )}
              >
                <FaLinkedin className="size-3.5" />
                LinkedIn
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>
            )}

            {application.github && (
              <a
                href={application.github}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
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
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "gap-2 text-xs",
                )}
              >
                <Globe className="size-3.5" />
                Website Pessoal
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>
            )}
          </div>
        </section>

        {/* Interests */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            Departamentos de Interesse
          </h2>
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground"
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum departamento selecionado.
            </p>
          )}
        </section>

        {/* Answers */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-foreground">
            Respostas ao Questionário
          </h2>

          <div className="space-y-6">
            {application.interestJustification && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Por que razão escolheste estes departamentos?
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {application.interestJustification}
                </p>
              </div>
            )}

            {application.experience && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Experiência prévia em projetos ou atividades
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {application.experience}
                </p>
              </div>
            )}

            {application.motivation && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  O que te motivou a candidatar ao NIAEFEUP?
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {application.motivation}
                </p>
              </div>
            )}

            {application.suggestions && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sugestões ou ideias para o NIAEFEUP
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {application.suggestions}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
