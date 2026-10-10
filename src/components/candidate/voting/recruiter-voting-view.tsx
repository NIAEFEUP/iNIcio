"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ClipboardList,
  ExternalLink,
  FileText,
  History,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { CandidateAvatarLightbox } from "@/components/candidates/candidate-avatar-lightbox";
import { CandidateLinksCard } from "@/components/candidate/candidate-links-card";
import { CandidateInterviewModal } from "./candidate-interview-modal";
import { CandidateDynamicModal } from "./candidate-dynamic-modal";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { getInitials } from "@/lib/utils";
import { ClassificationText } from "@/components/candidates/candidate-text";
import { useVotingWebSocket } from "@/lib/hooks/use-voting-websocket";
import type { CandidateVotingMetadata } from "@/lib/candidate";
import type { RecruiterVote, User, VotingPhase } from "@/lib/db";
import { FacilitatorChips } from "./candidate-facilitators";
import { CandidateAnswersModal } from "./candidate-answers-modal";
import { CandidateCommentsModal } from "./candidate-comments-modal";
import { toast } from "@/components/ui/toast";

interface RecruiterVotingViewProps {
  currentVotingPhase: VotingPhase & {
    candidates: Array<CandidateVotingMetadata>;
    status: {
      candidateId: string | null;
      accepted_candidates: number;
      rejected_candidates: number;
    };
  };
  recruiterVotes: RecruiterVote[];
  submitVoteAction: (
    recruiterId: string,
    candidateId: string,
    decision: "approve" | "reject",
  ) => Promise<boolean>;
  currentUserId: string;
  showBack?: boolean;
  token: string;
  facilitators: Record<string, { interviewers: User[]; facilitators: User[] }>;
}

export function RecruiterVotingView({
  currentVotingPhase,
  recruiterVotes: initialRecruiterVotes,
  submitVoteAction,
  currentUserId,
  showBack = false,
  token,
  facilitators,
}: RecruiterVotingViewProps) {
  const candidates = currentVotingPhase.candidates;

  const initialIdx = Math.max(
    0,
    candidates.findIndex((c) => c.id === currentVotingPhase.status.candidateId),
  );

  const [, setCurrentIndex] = useState(initialIdx);
  const [currentCandidate, setCurrentCandidate] =
    useState<CandidateVotingMetadata>(candidates[initialIdx] || candidates[0]);

  const [votedCandidateIds, setVotedCandidateIds] = useState<Set<string>>(
    () => new Set(initialRecruiterVotes.map((v) => v.candidateId)),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [dynamicModalOpen, setDynamicModalOpen] = useState(false);
  const [answersModalOpen, setAnswersModalOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);

  const live = useVotingWebSocket({
    votingPhaseId: currentVotingPhase.id,
    token,
    initial: {
      currentCandidateId: currentVotingPhase.status.candidateId,
      finishedCandidateIds: candidates
        .filter((c) => c.isFinished)
        .map((c) => c.id),
      acceptedCandidates: currentVotingPhase.status.accepted_candidates || 0,
      rejectedCandidates: currentVotingPhase.status.rejected_candidates || 0,
      terminated: Boolean(currentVotingPhase.terminated),
    },
  });
  const finishedIds = new Set(live.finishedCandidateIds);

  const activeCandidateId = live.currentCandidateId ?? undefined;
  const [prevActiveCandidateId, setPrevActiveCandidateId] = useState<
    string | undefined
  >(activeCandidateId);
  if (
    activeCandidateId !== undefined &&
    prevActiveCandidateId !== activeCandidateId
  ) {
    setPrevActiveCandidateId(activeCandidateId);
    const newIdx = candidates.findIndex((c) => c.id === activeCandidateId);
    if (newIdx !== -1) {
      setCurrentIndex(newIdx);
      setCurrentCandidate(candidates[newIdx]);
    }
  }

  const isPhaseTerminated = live.terminated;

  const hasVotedForCurrent = votedCandidateIds.has(currentCandidate?.id);
  const isCandidateFinished = finishedIds.has(currentCandidate?.id);

  const acceptedCount = live.acceptedCandidates;
  const rejectedCount = live.rejectedCandidates;
  const finishedCount = finishedIds.size;

  const handleVote = async (decision: "approve" | "reject") => {
    if (
      !currentCandidate ||
      isSubmitting ||
      hasVotedForCurrent ||
      isPhaseTerminated
    )
      return;

    setIsSubmitting(true);
    try {
      const ok = await submitVoteAction(
        currentUserId,
        currentCandidate.id,
        decision,
      );

      if (ok) {
        setVotedCandidateIds((prev) => new Set([...prev, currentCandidate.id]));
        toast.add({
          type: "success",
          title: "Voto submetido com sucesso!",
        });
      } else {
        toast.add({
          type: "error",
          title: "Não foi possível registar o voto.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.add({
        type: "error",
        title: "Erro ao submeter voto",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentCandidate) {
    return (
      <div className="flex flex-col flex-1 min-h-[calc(100vh-8rem)]">
        <PageHeader
          title="Votação"
          showBack={showBack}
          backHref="/candidates/voting"
          inlineOnMobile
        />
        <div className="flex flex-col items-center justify-center flex-1 py-20 px-4 text-center">
          <p className="text-muted-foreground text-sm">
            A aguardar pelo início da sessão de votação...
          </p>
        </div>
      </div>
    );
  }

  const degree = currentCandidate.application?.degree;
  const curricularYear = currentCandidate.application?.curricularYear;

  const hasInterview = Boolean(currentCandidate.interview);
  const dynamicId = currentCandidate.dynamic?.dynamicId || null;
  const hasDynamic = Boolean(dynamicId);
  const application = currentCandidate.application;
  const email = currentCandidate.email;
  const phone = application?.phone;

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100vh-8rem)]">
      {/* Session Progress in Header matching Admin Layout */}
      <PageHeader
        title="Votação"
        showBack={showBack}
        backHref="/candidates/voting"
        inlineOnMobile
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {!live.connected && (
              <span className="text-xs text-muted-foreground">
                A ligar ao servidor de votação…
              </span>
            )}
            {(currentCandidate.previousApplicationYears?.length ?? 0) > 0 && (
              <div
                className="flex items-center gap-1.5 text-xs rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-1.5 shadow-xs font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                title="Candidatou-se anteriormente"
              >
                <History className="size-3.5" />
                <span>
                  Re-candidato ·{" "}
                  {currentCandidate.previousApplicationYears.join(", ")}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnswersModalOpen(true)}
              className="h-8 gap-1.5 text-xs"
            >
              <ClipboardList className="size-3.5" />
              <span>Respostas</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommentsModalOpen(true)}
              className="h-8 gap-1.5 text-xs"
            >
              <MessageSquareText className="size-3.5" />
              <span>Comentários</span>
            </Button>
            {application?.curriculum && (
              <a
                href={application.curriculum}
                target="_blank"
                rel="noreferrer"
                className={`${buttonVariants({ variant: "outline", size: "sm" })} h-8 gap-1.5 text-xs`}
              >
                <FileText className="size-3.5" />
                <span>Ver currículo</span>
              </a>
            )}
            <Link
              href={`/candidate/${currentCandidate.id}`}
              target="_blank"
              rel="noreferrer"
              className={`${buttonVariants({ variant: "outline", size: "sm" })} h-8 gap-1.5 text-xs`}
            >
              <ExternalLink className="size-3.5" />
              <span>Ver página</span>
            </Link>
            <div className="flex items-center gap-2 text-xs rounded-lg border border-border/70 bg-card px-3 py-1.5 shadow-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Progresso:</span>
                <span className="font-semibold text-foreground">
                  {finishedCount}/{candidates.length}
                </span>
              </div>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {acceptedCount} aceites
              </span>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                {rejectedCount} rejeitados
              </span>
            </div>
          </div>
        }
      />

      {/* Main Content Area: Centered vertically, desktop side-by-side, mobile stacked */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 w-full items-stretch">
          {/* Left Column: Candidate Information */}
          <div className="flex flex-col gap-4 justify-center">
            {/* Avatar & Name */}
            <div className="flex flex-col items-center text-center gap-3">
              <CandidateAvatarLightbox
                name={currentCandidate.name || "Candidato"}
                picture={getStableImageUrl(currentCandidate.image)}
                initials={getInitials(currentCandidate.name)}
                size="xl"
                className="size-28 sm:size-32 shadow-sm"
                avatarClassName="size-28 sm:size-32"
              />
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {currentCandidate.name || "Sem nome"}
              </h2>
            </div>

            {/* Academic Information Card (Course and Year, no "ano" text) */}
            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">
                    Curso
                  </span>
                  <span className="text-sm font-semibold text-foreground uppercase">
                    {degree || "—"}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-medium text-muted-foreground">
                    Ano Curricular
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {curricularYear ? `${curricularYear}º` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Links + contacts to inform the decision */}
            <CandidateLinksCard
              githubUrl={application?.github}
              linkedinUrl={application?.linkedIn}
              websiteUrl={application?.personalWebsite}
            />
            {(email || phone) && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  <span>Contactos</span>
                </div>
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3 text-xs">
                  {email && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                        <Mail className="size-3.5" />
                        <span>Email</span>
                      </span>
                      <a
                        href={`mailto:${email}`}
                        className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[65%] text-right"
                        title={email}
                      >
                        {email}
                      </a>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                        <Phone className="size-3.5" />
                        <span>Telefone</span>
                      </span>
                      <a
                        href={`tel:${phone}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                        title={phone}
                      >
                        {phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Department interests */}
            {(application?.interests?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  <span>Departamentos de interesse</span>
                </div>
                <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs flex flex-wrap gap-1.5">
                  {application?.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Who ran the interview / dynamic */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                <span>Equipa</span>
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-[11px] font-medium text-muted-foreground">
                    Entrevista
                  </span>
                  <FacilitatorChips
                    users={
                      facilitators[currentCandidate.id]?.interviewers ?? []
                    }
                    emptyLabel="Sem entrevistadores atribuídos"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-[11px] font-medium text-muted-foreground">
                    Dinâmica
                  </span>
                  <FacilitatorChips
                    users={
                      facilitators[currentCandidate.id]?.facilitators ?? []
                    }
                    emptyLabel="Sem facilitadores atribuídos"
                  />
                </div>
              </div>
            </div>

            {/* Two Classification Cards with notes + full-page links */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="rounded-xl border border-border/70 bg-card p-3.5 text-center shadow-xs flex flex-col items-center justify-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Entrevista
                </span>
                <ClassificationText
                  level={currentCandidate.interviewClassification}
                  className="text-sm sm:text-base font-semibold"
                />
                {hasInterview && (
                  <div className="flex items-center justify-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setInterviewModalOpen(true)}
                      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                      title="Ver notas da entrevista"
                    >
                      <FileText className="size-3" />
                      <span>Notas</span>
                    </button>
                    <Link
                      href={`/candidate/${currentCandidate.id}/interview`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Abrir página da entrevista"
                    >
                      <ExternalLink className="size-3" />
                      <span>Página</span>
                    </Link>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border/70 bg-card p-3.5 text-center shadow-xs flex flex-col items-center justify-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Dinâmica
                </span>
                <ClassificationText
                  level={currentCandidate.dynamicClassification}
                  className="text-sm sm:text-base font-semibold"
                />
                {hasDynamic && (
                  <div className="flex items-center justify-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setDynamicModalOpen(true)}
                      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                      title="Ver notas da dinâmica"
                    >
                      <FileText className="size-3" />
                      <span>Notas</span>
                    </button>
                    <Link
                      href={`/dynamic/${dynamicId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Abrir página da dinâmica"
                    >
                      <ExternalLink className="size-3" />
                      <span>Página</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="flex flex-col justify-center w-full">
            {isPhaseTerminated ? (
              <div className="rounded-2xl border border-border/70 bg-card p-8 flex flex-col items-center justify-center text-center space-y-2 h-full min-h-[220px] shadow-xs">
                <div className="text-base font-semibold text-foreground">
                  Sessão de votação terminada
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta sessão de votação foi encerrada pela administração.
                </p>
              </div>
            ) : isCandidateFinished ? (
              <div className="rounded-2xl border border-border/70 bg-card p-8 flex flex-col items-center justify-center text-center space-y-2 h-full min-h-[220px] shadow-xs">
                <div className="text-base font-semibold text-foreground">
                  Votação concluída
                </div>
                <p className="text-xs text-muted-foreground">
                  A votação deste candidato foi finalizada pelo administrador. A
                  aguardar pelo próximo candidato...
                </p>
              </div>
            ) : hasVotedForCurrent ? (
              <div className="rounded-2xl border border-border/70 bg-card p-8 flex flex-col items-center justify-center text-center space-y-1.5 h-full min-h-[220px] shadow-xs">
                <div className="text-base font-semibold text-foreground">
                  Voto registado
                </div>
                <p className="text-xs text-muted-foreground max-w-xs">
                  A aguardar pela decisão final ou pela transição para o próximo
                  candidato...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* ACEITAR Button - Neutral card styling */}
                <Button
                  variant="outline"
                  onClick={() => handleVote("approve")}
                  disabled={isSubmitting}
                  className="h-12 w-full flex flex-row items-center justify-center gap-2 text-base font-semibold bg-card hover:bg-emerald-500/10 hover:border-emerald-500/30 text-foreground border-2 border-border/80 active:scale-[0.98] rounded-xl shadow-xs transition-all duration-150"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="size-5 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
                      <span>Aceitar</span>
                    </>
                  )}
                </Button>

                {/* REJEITAR Button - Neutral card styling */}
                <Button
                  variant="outline"
                  onClick={() => handleVote("reject")}
                  disabled={isSubmitting}
                  className="h-12 w-full flex flex-row items-center justify-center gap-2 text-base font-semibold bg-card hover:bg-rose-500/10 hover:border-rose-500/30 text-foreground border-2 border-border/80 active:scale-[0.98] rounded-xl shadow-xs transition-all duration-150"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      <X className="size-5 stroke-[2.5] text-rose-600 dark:text-rose-400" />
                      <span>Rejeitar</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals for Interview & Dynamic */}
      <CandidateInterviewModal
        candidateId={currentCandidate.id}
        open={interviewModalOpen}
        onOpenChange={setInterviewModalOpen}
      />

      <CandidateDynamicModal
        dynamicId={dynamicId}
        open={dynamicModalOpen}
        onOpenChange={setDynamicModalOpen}
      />

      <CandidateAnswersModal
        candidateName={currentCandidate.name || "Candidato"}
        application={application}
        open={answersModalOpen}
        onOpenChange={setAnswersModalOpen}
      />

      <CandidateCommentsModal
        candidateId={currentCandidate.id}
        candidateName={currentCandidate.name || "Candidato"}
        open={commentsModalOpen}
        onOpenChange={setCommentsModalOpen}
      />
    </div>
  );
}
