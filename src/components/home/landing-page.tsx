"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { RecruitmentPhase } from "@/lib/db";
import type { UserApplicationWithDetails } from "@/lib/application";
import type { CandidateRecruitmentResult } from "@/lib/final-messages";
import type {
  RecruitmentStatus,
  ApplicationStatus,
} from "@/lib/recruitment-state";
import { CandidateApplicationModal } from "@/components/candidate/candidate-application-modal";
import { CandidateResultModal } from "@/components/candidate/candidate-result-modal";

interface OpenDayAnnouncement {
  id: number;
  enabled: boolean;
  date: Date;
  room: string;
  startTime: string;
  endTime: string;
  image: string;
}

interface LandingPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    role?: "candidate" | "recruiter" | "admin" | null;
  } | null;
  isCandidate?: boolean;
  isRecruiter: boolean;
  isAdmin: boolean;
  hasApplied: boolean;
  userApplications?: UserApplicationWithDetails[];
  currentRecruitmentId?: number | null;
  recruitmentStatus: RecruitmentStatus;
  applicationStatus: ApplicationStatus;
  applicationDeadline?: string | null;
  phases?: RecruitmentPhase[];
  openDayAnnouncement?: OpenDayAnnouncement | null;
}

export default function LandingPage({
  user,
  isRecruiter,
  isAdmin,
  hasApplied,
  userApplications = [],
  currentRecruitmentId,
  recruitmentStatus,
  applicationStatus,
  applicationDeadline,
  openDayAnnouncement,
}: LandingPageProps) {
  const [selectedApplication, setSelectedApplication] =
    useState<UserApplicationWithDetails | null>(null);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);

  const [selectedResult, setSelectedResult] =
    useState<CandidateRecruitmentResult | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const isApplicationOpen =
    recruitmentStatus === "open" && applicationStatus === "open";

  const currentApplication = currentRecruitmentId
    ? userApplications.find((app) => app.recruitmentId === currentRecruitmentId)
    : null;

  const openDayDate = openDayAnnouncement?.date
    ? new Intl.DateTimeFormat("pt-PT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(openDayAnnouncement.date))
    : null;

  return (
    <div className="flex flex-col bg-background">
      {openDayAnnouncement && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full pt-8 sm:pt-10">
          <div className="relative overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
            <div className="relative h-[260px] sm:h-[340px] w-full">
              <Image
                src={openDayAnnouncement.image || "/images/ni.jpg"}
                alt="NI Open Day"
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/35" />
              <div className="absolute inset-0 flex items-end p-6 sm:p-10">
                <div className="max-w-2xl text-white">
                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">
                    NI Open Day
                  </h2>
                  <p className="mt-3 text-base sm:text-lg text-white/90">
                    {openDayDate && `Dia ${openDayDate}`} ·{" "}
                    {openDayAnnouncement.startTime} -{" "}
                    {openDayAnnouncement.endTime}
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-white/80">
                    Estamos na {openDayAnnouncement.room}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 text-center max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[1.1] mb-6">
          Queres fazer parte do NI?
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
          Somos o Núcleo de Informática da Faculdade de Engenharia da
          Universidade do Porto. Apoiamos todos os estudantes de informática na
          sua adaptação na universidade e desenvolvemos produtos para toda a
          comunidade académica!
        </p>

        <div className="flex flex-col items-center justify-center gap-4">
          {!user ? (
            <>
              {isApplicationOpen ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/signup"
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "text-base px-6 h-12 gap-2",
                      )}
                    >
                      Candidatar Agora
                      <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      href="/login"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "lg" }),
                        "text-base px-6 h-12",
                      )}
                    >
                      Já tens conta? Entrar
                    </Link>
                  </div>
                  {applicationDeadline && (
                    <p className="text-xs text-muted-foreground">
                      Candidaturas abertas até {applicationDeadline}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {recruitmentStatus === "upcoming"
                    ? "Um novo ciclo de recrutamento está a ser preparado. Fica atento às próximas novidades!"
                    : "Não existem candidaturas abertas de momento. Fica atento às próximas novidades!"}
                </span>
              )}
            </>
          ) : isRecruiter || isAdmin ? (
            <Link
              href={isAdmin ? "/admin" : "/recruiter"}
              className={cn(
                buttonVariants({ size: "lg" }),
                "text-base px-6 h-12 gap-2",
              )}
            >
              Painel de Recrutamento
              <ArrowRight className="size-4" />
            </Link>
          ) : hasApplied ? null : isApplicationOpen ? (
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/application"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "text-base px-6 h-12 gap-2",
                )}
              >
                Preencher Candidatura
                <ArrowRight className="size-4" />
              </Link>
              {applicationDeadline && (
                <p className="text-xs text-muted-foreground">
                  Candidaturas abertas até {applicationDeadline}
                </p>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {recruitmentStatus === "upcoming"
                ? "Um novo ciclo de recrutamento está a ser preparado. Fica atento às próximas novidades!"
                : "Não existem candidaturas abertas de momento. Fica atento às próximas novidades!"}
            </span>
          )}
        </div>
      </section>

      {user && userApplications.length > 0 && (
        <section
          id="candidaturas"
          className="py-8 max-w-7xl mx-auto px-4 sm:px-6 w-full"
        >
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  As tuas Candidaturas
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Histórico de candidaturas submetidas nos processos de
                  recrutamento do NIAEFEUP.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {userApplications.map((app) => {
                const isCurrent =
                  currentRecruitmentId != null &&
                  app.recruitmentId === currentRecruitmentId;
                const formattedDate = app.submittedAt
                  ? new Date(app.submittedAt).toLocaleDateString("pt-PT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Data indisponível";
                const recruitmentName =
                  app.recruitment?.title ??
                  `Recrutamento #${app.recruitmentId}`;
                const termInfo =
                  app.recruitment?.lectiveYear && app.recruitment?.semester
                    ? `${app.recruitment.lectiveYear} · ${app.recruitment.semester}º Semestre`
                    : null;

                const hasResult =
                  app.result != null &&
                  (app.result.decision === "approved" ||
                    app.result.decision === "rejected");

                return (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground text-base">
                          {recruitmentName}
                        </span>
                        {isCurrent ? (
                          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {termInfo && <span>{termInfo}</span>}
                        {termInfo && <span>•</span>}
                        <span>Submetida em {formattedDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {isCurrent ? (
                        <Link
                          href="/candidate/progress"
                          className={cn(
                            buttonVariants({ size: "sm" }),
                            "text-xs gap-1.5",
                          )}
                        >
                          Ver Progresso
                        </Link>
                      ) : hasResult ? (
                        <Button
                          size="sm"
                          className="text-xs gap-1.5 cursor-pointer"
                          onClick={() => {
                            setSelectedResult(app.result ?? null);
                            setIsResultModalOpen(true);
                          }}
                        >
                          Ver Resultado
                        </Button>
                      ) : null}

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs cursor-pointer"
                        onClick={() => {
                          setSelectedApplication(app);
                          setIsAppModalOpen(true);
                        }}
                      >
                        Ver Candidatura
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center mb-10">
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
            O que fazemos!
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="group relative overflow-hidden rounded-2xl bg-muted/40 aspect-4/3 sm:aspect-3/4">
            <Image
              src="/images/sinf.jpg"
              alt="SINF na FEUP"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
              <p className="text-base font-bold leading-tight mt-0.5">
                Semana de Informática
              </p>
              <p className="text-xs text-white/80 mt-1 leading-snug">
                O nosso maior evento, pensado para adquirir conhecimento e fazer
                networking com diversas empresas.
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-muted/40 aspect-4/3 sm:aspect-3/4">
            <Image
              src="/images/eventos.jpg"
              alt="Equipa a desenvolver software"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
              <p className="text-base font-bold leading-tight mt-0.5">
                Eventos
              </p>
              <p className="text-xs text-white/80 mt-1 leading-snug">
                Dinamização entre os estudantes com vários workshops, jantares
                de curso e apoios na vida académica.
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-muted/40 aspect-4/3 sm:aspect-3/4">
            <Image
              src="/images/projetos.jpg"
              alt="Workshop e partilha de conhecimento"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
              <p className="text-base font-bold leading-tight mt-0.5">
                Projetos
              </p>
              <p className="text-xs text-white/80 mt-1 leading-snug">
                Desenvolvimento de produtos que ajudam toda a comunidade durante
                o seu percurso na universidade.
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-muted/40 aspect-4/3 sm:aspect-3/4">
            <Image
              src="/images/ni.jpg"
              alt="Membros do NIAEFEUP juntos"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
              <p className="text-base font-bold leading-tight mt-0.5">O NI</p>
              <p className="text-xs text-white/80 mt-1 leading-snug">
                Desde a nossa sala, a vários jantares e eventos internos e até
                viagens inesquecíveis.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center mb-10">
          <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
            Como funciona o recrutamento?
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center sm:text-left">
          <div className="space-y-2">
            <span className="text-3xl font-black text-primary/80">01</span>
            <h4 className="font-bold text-foreground text-base">Candidatura</h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Preenches um formulário rápido com os teus interesses,
              disponibilidade e percurso.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-3xl font-black text-primary/80">02</span>
            <h4 className="font-bold text-foreground text-base">Entrevista</h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Uma conversa individual para te conhecermos melhor, alinhar
              expectativas e objetivos.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-3xl font-black text-primary/80">03</span>
            <h4 className="font-bold text-foreground text-base">
              Dinâmica de Grupo
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Uma sessão prática e descontraída em equipa para resolveres
              desafios em conjunto.
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-3xl font-black text-primary/80">04</span>
            <h4 className="font-bold text-foreground text-base">Integração</h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Comunicação dos resultados e boas-vindas com início imediato nas
              equipas do núcleo.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <h3 className="text-2xl font-bold text-foreground text-center mb-8">
          Perguntas Frequentes
        </h3>

        <Accordion className="max-w-2xl mx-auto space-y-2">
          <AccordionItem value="faq-1" className="border-none py-1">
            <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-2">
              Alunos do 1.º ano podem candidatar-se?
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Sim! Grande parte da nossa equipa entrou precisamente no primeiro
              ano da faculdade. É uma ótima maneira de desenvolver novas
              capacidades e fazer amigos para o resto do curso.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-2" className="border-none py-1">
            <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-2">
              Quanto tempo por semana é necessário dedicar?
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Os teus estudos estão sempre em primeiro lugar. A dedicação fica
              ao teu critério, com total flexibilidade durante épocas de exames
              e entregas de trabalhos.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-3" className="border-none py-1">
            <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-2">
              Preciso de experiência para me conseguir integrar na equipa?
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Não! O objetivo do núcleo é maioritariamente ensinar todos os
              membros com qualquer questão que possam ter. Desde que tenhas
              vontade de aprender, estás no sítio certo.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-4" className="border-none py-1">
            <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-2">
              Posso estar em mais do que um departamento ao mesmo tempo?
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Tens toda a flexibilidade e liberdade para experimentar novos
              departamentos quando quiseres. Se achas que não estás a gostar do
              departamento atual, podes simplesmente começar a aparecer nas
              reuniões de qualquer outro.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-5" className="border-none py-1">
            <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-2">
              Em que departamentos posso entrar?
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>Imagem:</strong> Criação dos elementos visuais do
                  núcleo, contribuição para a identidade gráfica e design de
                  interfaces (UI/UX) dos nossos projetos.
                </li>
                <li>
                  <strong>Comunicação e Relações Externas:</strong> Divulgação
                  de iniciativas junto da comunidade académica e gestão de
                  parcerias externas.
                </li>
                <li>
                  <strong>Eventos:</strong> Organização e dinamização de
                  iniciativas como workshops, palestras, hackathons e convívios.
                </li>
                <li>
                  <strong>Projetos:</strong> Desenvolvimento de software e
                  soluções com impacto real para a comunidade académica.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faq-6" className="border-none py-1">
            <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-2">
              O que ganho ao entrar no NI?
            </AccordionTrigger>
            <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Trabalho prático em projetos reais, aprendizagem contínua com
              membros mais experientes, uma rede de contactos sólida na
              faculdade e no mercado de trabalho, e um currículo diferenciador.
              Tudo isto enquanto fazes parte de uma comunidade ativa e
              acolhedora.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <CandidateApplicationModal
        open={isAppModalOpen}
        onOpenChange={setIsAppModalOpen}
        application={selectedApplication}
        user={user}
      />

      <CandidateResultModal
        open={isResultModalOpen}
        onOpenChange={setIsResultModalOpen}
        result={selectedResult}
      />
    </div>
  );
}
