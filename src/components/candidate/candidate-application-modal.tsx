"use client";

import { FileText, ExternalLink, Globe } from "lucide-react";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserApplicationWithDetails } from "@/lib/application";

interface CandidateApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: UserApplicationWithDetails | null;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

export function CandidateApplicationModal({
  open,
  onOpenChange,
  application,
  user,
}: CandidateApplicationModalProps) {
  if (!application) return null;

  const formattedDate = application.submittedAt
    ? new Date(application.submittedAt).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Data indisponível";

  const recruitmentName =
    application.recruitment?.title ??
    `Recrutamento #${application.recruitmentId}`;
  const termInfo =
    application.recruitment?.lectiveYear && application.recruitment?.semester
      ? `${application.recruitment.lectiveYear} · ${application.recruitment.semester}º Semestre`
      : null;

  const interests = application.interests || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="space-y-2 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {termInfo && (
              <>
                <span className="text-xs text-muted-foreground">
                  {termInfo}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
              </>
            )}
            <span className="text-xs text-muted-foreground">
              Submetida a {formattedDate}
            </span>
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            A tua Candidatura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Informações Pessoais
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 p-3.5 rounded-xl bg-muted/40">
                <span className="text-xs text-muted-foreground">Nome</span>
                <p className="text-sm font-medium text-foreground">
                  {user?.name || "Não indicado"}
                </p>
              </div>
              <div className="space-y-1 p-3.5 rounded-xl bg-muted/40">
                <span className="text-xs text-muted-foreground">Email</span>
                <p className="text-sm font-medium text-foreground">
                  {user?.email || "Não indicado"}
                </p>
              </div>
              <div className="space-y-1 p-3.5 rounded-xl bg-muted/40">
                <span className="text-xs text-muted-foreground">
                  Número de Estudante
                </span>
                <p className="text-sm font-medium text-foreground">
                  {application.studentNumber || "Não indicado"}
                </p>
              </div>
              <div className="space-y-1 p-3.5 rounded-xl bg-muted/40">
                <span className="text-xs text-muted-foreground">Telefone</span>
                <p className="text-sm font-medium text-foreground">
                  {application.phone || "Não indicado"}
                </p>
              </div>
              <div className="space-y-1 p-3.5 rounded-xl bg-muted/40 sm:col-span-2">
                <span className="text-xs text-muted-foreground">
                  Curso e Ano
                </span>
                <p className="text-sm font-medium text-foreground">
                  {application.degree || "Não indicado"}
                  {application.curricularYear
                    ? ` · ${application.curricularYear}`
                    : ""}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Presença Online & CV
            </h3>
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

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Áreas de Interesse
            </h3>
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

          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Respostas Submetidas
            </h3>
            <div className="space-y-3">
              {application.interestJustification && (
                <div className="space-y-1.5 p-4 rounded-xl bg-muted/20 border border-border/60">
                  <span className="text-xs font-medium text-muted-foreground">
                    Por que razão escolheste estes departamentos?
                  </span>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {application.interestJustification}
                  </p>
                </div>
              )}

              {application.experience && (
                <div className="space-y-1.5 p-4 rounded-xl bg-muted/20 border border-border/60">
                  <span className="text-xs font-medium text-muted-foreground">
                    Experiência prévia em projetos ou atividades
                  </span>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {application.experience}
                  </p>
                </div>
              )}

              {application.motivation && (
                <div className="space-y-1.5 p-4 rounded-xl bg-muted/20 border border-border/60">
                  <span className="text-xs font-medium text-muted-foreground">
                    O que te motivou a candidatar ao NIAEFEUP?
                  </span>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {application.motivation}
                  </p>
                </div>
              )}

              {application.suggestions && (
                <div className="space-y-1.5 p-4 rounded-xl bg-muted/20 border border-border/60">
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
      </DialogContent>
    </Dialog>
  );
}
