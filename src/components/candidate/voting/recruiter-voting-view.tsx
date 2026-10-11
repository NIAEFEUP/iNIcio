"use client";

import { useState } from "react";
import {
  Ban,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  History,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  Vote,
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
import { useVotingWebSocket } from "@/lib/hooks/use-voting-websocket";
import type { CandidateVotingMetadata } from "@/lib/candidate";
import type { RecruiterVote, User, VotingPhase } from "@/lib/db";
import { CandidateAnswersModal } from "./candidate-answers-modal";
import { CandidateCommentsModal } from "./candidate-comments-modal";
import { toast } from "@/components/ui/toast";
import { CandidateEvaluationGuidesCard } from "./candidate-evaluation-guides-card";
import { VotingSessionDrawer } from "./voting-session-drawer";

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

  const votedCandidateIds = new Set(
    initialRecruiterVotes.map((v) => v.candidateId),
  );
  const [votedAtResetVersion, setVotedAtResetVersion] = useState<
    Record<string, number>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [dynamicModalOpen, setDynamicModalOpen] = useState(false);
  const [answersModalOpen, setAnswersModalOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [sessionDrawerOpen, setSessionDrawerOpen] = useState(false);

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

  const currentResetVersion =
    live.resetVersionsByCandidate[currentCandidate?.id] ?? 0;
  const hasVotedForCurrent =
    votedAtResetVersion[currentCandidate?.id] === currentResetVersion ||
    (currentResetVersion === 0 && votedCandidateIds.has(currentCandidate?.id));
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
        setVotedAtResetVersion((prev) => ({
          ...prev,
          [currentCandidate.id]: currentResetVersion,
        }));
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSessionDrawerOpen(true)}
              className="h-8 gap-1.5 text-xs"
            >
              <Vote className="size-3.5" />
              <span>
                Sessão · {finishedCount}/{candidates.length}
              </span>
            </Button>
          </div>
        }
      />

      {/* Main Content Area: Main info first, then split layout on desktop */}
      <div className="flex-1 flex flex-col items-center w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col gap-5 w-full">
          {/* Main Candidate Information */}
          <div className="flex flex-col gap-4 w-full items-center">
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
              <div className="flex items-center gap-2 justify-center">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {currentCandidate.name || "Sem nome"}
                </h2>
                {(currentCandidate.previousApplicationYears?.length ?? 0) >
                  0 && (
                  <History
                    className="size-5 text-amber-600 dark:text-amber-400 shrink-0"
                    aria-label="Re-candidato"
                    title={`Re-candidato · ${currentCandidate.previousApplicationYears.join(", ")}`}
                  />
                )}
              </div>
            </div>

            {/* Academic Information (Course and Year, no card) */}
            <div className="flex items-center justify-center gap-6 sm:gap-8 text-center">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">
                  Curso
                </span>
                <span className="text-sm font-semibold text-foreground uppercase">
                  {degree || "—"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">
                  Ano Curricular
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {curricularYear ? `${curricularYear}º` : "—"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 w-full max-w-2xl">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnswersModalOpen(true)}
                className="flex-1 sm:flex-none h-9 gap-1.5 text-xs"
              >
                <ClipboardList className="size-3.5" />
                <span>Respostas</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommentsModalOpen(true)}
                className="flex-1 sm:flex-none h-9 gap-1.5 text-xs"
              >
                <MessageSquareText className="size-3.5" />
                <span>Comentários</span>
              </Button>
              {application?.curriculum && (
                <a
                  href={application.curriculum}
                  target="_blank"
                  rel="noreferrer"
                  className={`${buttonVariants({ variant: "outline", size: "sm" })} flex-1 sm:flex-none h-9 gap-1.5 text-xs`}
                >
                  <FileText className="size-3.5" />
                  <span>Currículo</span>
                </a>
              )}
            </div>
          </div>

          {/* Split layout: Secondary info (left) and Vote buttons (right) on desktop */}
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            {/* Secondary Information - Left Column on Desktop */}
            <div className="flex flex-col gap-3 w-full order-2 lg:order-1">
              <CandidateEvaluationGuidesCard
                hasInterview={hasInterview}
                hasDynamic={hasDynamic}
                interviewClassification={
                  currentCandidate.interviewClassification
                }
                dynamicClassification={currentCandidate.dynamicClassification}
                interviewers={
                  facilitators[currentCandidate.id]?.interviewers ?? []
                }
                dynamicFacilitators={
                  facilitators[currentCandidate.id]?.facilitators ?? []
                }
                onOpenInterview={() => setInterviewModalOpen(true)}
                onOpenDynamic={() => setDynamicModalOpen(true)}
              />
              <CandidateLinksCard
                githubUrl={application?.github}
                linkedinUrl={application?.linkedIn}
                websiteUrl={application?.personalWebsite}
              />
              {(email || phone) && (
                <div className="space-y-2">
                  <div className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Contactos
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-xs space-y-3 text-xs">
                    {email && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                          <Mail className="size-3.5" />
                          Email
                        </span>
                        <a
                          href={`mailto:${email}`}
                          className="max-w-[65%] truncate text-right font-medium text-foreground hover:text-primary"
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
                          Telefone
                        </span>
                        <a
                          href={`tel:${phone}`}
                          className="font-medium text-foreground hover:text-primary"
                          title={phone}
                        >
                          {phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {(application?.interests?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <div className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Departamentos de interesse
                  </div>
                  <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/70 bg-card p-3.5 shadow-xs">
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
            </div>

            {/* Vote Actions - Right Column on Desktop */}
            <div className="flex flex-col items-center w-full order-1 lg:order-2 lg:sticky lg:top-6">
              <div className="w-full max-w-lg lg:max-w-none">
                <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs w-full">
                  <p className="text-sm font-semibold text-foreground text-center mb-3">
                    Registar o teu voto
                  </p>
                  {isPhaseTerminated ? (
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-6 flex flex-col items-center justify-center text-center space-y-2 min-h-[180px]">
                      <Ban className="size-6 text-muted-foreground" />
                      <div className="text-base font-semibold text-foreground">
                        Sessão de votação terminada
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Esta sessão de votação foi encerrada pela administração.
                      </p>
                    </div>
                  ) : isCandidateFinished ? (
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-6 flex flex-col items-center justify-center text-center space-y-2 min-h-[180px]">
                      <Clock className="size-6 text-muted-foreground" />
                      <div className="text-base font-semibold text-foreground">
                        Votação concluída
                      </div>
                      <p className="text-xs text-muted-foreground">
                        A votação deste candidato foi finalizada pelo
                        administrador. A aguardar pelo próximo candidato...
                      </p>
                    </div>
                  ) : hasVotedForCurrent ? (
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-6 flex flex-col items-center justify-center text-center space-y-2 min-h-[180px]">
                      <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-base font-semibold text-foreground">
                        Voto registado
                      </div>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        A aguardar pela decisão final ou pela transição para o
                        próximo candidato...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 w-full">
                      {/* ACEITAR Button - Neutral card styling */}
                      <Button
                        variant="outline"
                        onClick={() => handleVote("approve")}
                        disabled={isSubmitting}
                        className="h-14 sm:h-13 w-full flex flex-row items-center justify-center gap-2 text-base font-semibold bg-card hover:bg-emerald-500/10 hover:border-emerald-500/30 text-foreground border-2 border-border/80 active:scale-[0.98] rounded-xl shadow-xs transition-all duration-150"
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
                        className="h-14 sm:h-13 w-full flex flex-row items-center justify-center gap-2 text-base font-semibold bg-card hover:bg-rose-500/10 hover:border-rose-500/30 text-foreground border-2 border-border/80 active:scale-[0.98] rounded-xl shadow-xs transition-all duration-150"
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

      <VotingSessionDrawer
        open={sessionDrawerOpen}
        onOpenChange={setSessionDrawerOpen}
        candidates={candidates}
        currentCandidateId={currentCandidate.id}
        onSelectCandidate={(index) => {
          setCurrentIndex(index);
          setCurrentCandidate(candidates[index]);
        }}
        finishedCandidateIds={finishedIds}
        voteCountsByCandidate={live.voteCountsByCandidate}
        acceptedCandidates={acceptedCount}
        rejectedCandidates={rejectedCount}
        recruitersConnected={live.recruitersConnected}
        isTerminated={live.terminated}
        onOpenTerminateDialog={() => {}}
        showAdminActions={false}
      />
    </div>
  );
}
