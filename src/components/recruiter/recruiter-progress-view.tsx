"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Clock,
  ExternalLink,
  Layers,
  UserCheck,
  Users,
  Vote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export interface RecruiterPhaseViewData {
  id: number;
  title: string;
  description: string | null;
  clientIdentifier: string;
  start: string | null;
  end: string | null;
  checked: boolean;
}

export interface RecruiterEventData {
  id: string;
  type: "interview" | "dynamic";
  title: string;
  candidateName: string;
  candidateImage?: string | null;
  start: string;
  duration: number;
  link: string;
}

export interface RecruiterProgressViewProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image?: string | null;
  };
  recruitment: {
    id: number;
    title: string;
    lectiveYear?: string | null;
    semester?: number | null;
    start: string;
    end: string;
    active: boolean;
  };
  phases: RecruiterPhaseViewData[];
  events: RecruiterEventData[];
  stats: {
    candidatesCount: number;
    availabilitiesCount: number;
    votingPhasesCount: number;
  };
}

function formatDateRange(startStr: string | null, endStr: string | null) {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr);
  const end = new Date(endStr);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString("pt-PT", { month: "short" });
  const endMonth = end.toLocaleDateString("pt-PT", { month: "short" });

  if (startMonth === endMonth) {
    return `${startDay} — ${endDay} ${startMonth}`;
  }
  return `${startDay} ${startMonth} — ${endDay} ${endMonth}`;
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  const formatted = d.toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${formatted}, às ${time}`;
}

function getPhaseAction(
  clientIdentifier: string,
  userId: string,
  hasAvailabilities: boolean,
) {
  const ident = clientIdentifier.trim().toLowerCase();

  if (
    ident === "availability" ||
    ident === "recruiter_availability" ||
    ident === "disponibilidade"
  ) {
    return {
      actionUrl: "/recruiter/availability",
      actionLabel: hasAvailabilities
        ? "Alterar disponibilidade"
        : "Marcar disponibilidade",
    };
  }

  if (
    ident === "avaliacao" ||
    ident === "candidatos" ||
    ident === "who_knows" ||
    ident === "candidatura"
  ) {
    return {
      actionUrl: "/candidates",
      actionLabel: "Avaliar candidatos",
    };
  }

  if (ident === "votacao" || ident === "voting" || ident === "votação") {
    return {
      actionUrl: "/candidates/voting",
      actionLabel: "Ir para votações",
    };
  }

  if (
    ident === "entrevista" ||
    ident === "entrevistas" ||
    ident === "dinamica" ||
    ident === "dinâmica"
  ) {
    return {
      actionUrl: `/calendar/${userId}`,
      actionLabel: "Ver agenda",
    };
  }

  return {
    actionUrl: "/candidates",
    actionLabel: "Aceder",
  };
}

export function RecruiterProgressView({
  user,
  recruitment,
  phases,
  events,
  stats,
}: RecruiterProgressViewProps) {
  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.start) >= now);
  const pastEvents = events.filter((e) => new Date(e.start) < now);

  const totalPhases = phases.length;
  const completedPhases = phases.filter((p) => p.checked).length;
  const progressPercent =
    totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Progresso do Recrutador" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-wider font-medium">
              Alocações
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {events.length}
            </CardTitle>
            <CardAction>
              <div className="rounded-lg p-2 bg-muted text-muted-foreground">
                <Calendar className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {upcomingEvents.length} próximas · {pastEvents.length} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-wider font-medium">
              Candidatos
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {stats.candidatesCount}
            </CardTitle>
            <CardAction>
              <div className="rounded-lg p-2 bg-muted text-muted-foreground">
                <Users className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Inscrições neste recrutamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="text-xs uppercase tracking-wider font-medium">
              Fases de Recrutador
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {completedPhases}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / {totalPhases}
              </span>
            </CardTitle>
            <CardAction>
              <div className="rounded-lg p-2 bg-muted text-muted-foreground">
                <Layers className="size-4" />
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {totalPhases > 0
                ? `${progressPercent}% das etapas concluídas`
                : "Nenhuma fase configurada"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Operational Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Allocations & Recruiter-Specific Phases */}
        <div className="lg:col-span-2 space-y-6">
          {/* Próximas Alocações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="size-4 text-muted-foreground" />
                Próximas Alocações
              </CardTitle>
              <CardDescription>
                Entrevistas e dinâmicas atribuídas neste recrutamento
              </CardDescription>
              <CardAction>
                <Button
                  nativeButton={false}
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                  render={<Link href={`/calendar/${user.id}`} />}
                >
                  Ver agenda
                  <ArrowRight className="size-3" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Não existem entrevistas ou dinâmicas agendadas para breve
                  neste recrutamento.
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {event.candidateName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            (
                            {event.type === "interview"
                              ? "Entrevista"
                              : "Dinâmica"}
                            )
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatEventDate(event.start)} · {event.duration} min
                        </p>
                      </div>

                      <Button
                        nativeButton={false}
                        variant="outline"
                        size="xs"
                        className="gap-1 self-start sm:self-center shrink-0"
                        render={<Link href={event.link} />}
                      >
                        Abrir ficha
                        <ExternalLink className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fases do Recrutador (Database-driven recruiter phases) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="size-4 text-muted-foreground" />
                Fases do Recrutador
              </CardTitle>
              <CardDescription>
                Etapas específicas configuradas para os recrutadores neste
                período
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {phases.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Não existem fases específicas de recrutador configuradas para
                  este recrutamento.
                </p>
              ) : (
                phases.map((phase) => {
                  const start = phase.start ? new Date(phase.start) : null;
                  const end = phase.end ? new Date(phase.end) : null;
                  const isOngoing =
                    start && end
                      ? now >= start && now <= end && !phase.checked
                      : false;
                  const isEnded = end ? now > end && !phase.checked : false;

                  let statusLabel = "Pendente";
                  let statusClass = "text-muted-foreground";

                  if (phase.checked) {
                    statusLabel = "Concluída";
                    statusClass = "text-emerald-600 dark:text-emerald-400";
                  } else if (isOngoing) {
                    statusLabel = "A decorrer";
                    statusClass = "text-primary font-medium";
                  } else if (isEnded) {
                    statusLabel = "Terminada";
                    statusClass = "text-muted-foreground";
                  }

                  const dateRange = formatDateRange(phase.start, phase.end);
                  const { actionUrl, actionLabel } = getPhaseAction(
                    phase.clientIdentifier,
                    user.id,
                    stats.availabilitiesCount > 0,
                  );

                  return (
                    <div
                      key={phase.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {phase.title}
                          </span>
                          <span className={cn("text-xs", statusClass)}>
                            {statusLabel}
                          </span>
                        </div>
                        {phase.description && (
                          <p className="text-xs text-muted-foreground">
                            {phase.description}
                          </p>
                        )}
                        {dateRange && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
                            <Clock className="size-3" />
                            <span>{dateRange}</span>
                          </p>
                        )}
                      </div>

                      <Button
                        nativeButton={false}
                        variant={phase.checked ? "outline" : "default"}
                        size="xs"
                        className="self-start sm:self-center shrink-0"
                        render={<Link href={actionUrl} />}
                      >
                        {actionLabel}
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Quick Access & Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acessos Rápidos</CardTitle>
              <CardDescription>
                Atalhos diretos para as ferramentas de recrutamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <Button
                nativeButton={false}
                variant="ghost"
                size="sm"
                className="w-full justify-between font-normal text-muted-foreground hover:text-foreground"
                render={<Link href="/recruiter/availability" />}
              >
                <div className="flex items-center gap-2.5">
                  <CalendarClock className="size-4" />
                  <span className="text-foreground">
                    A Minha Disponibilidade
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {stats.availabilitiesCount > 0 ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {stats.availabilitiesCount} slots
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      Pendente
                    </span>
                  )}
                  <ArrowRight className="size-3.5" />
                </div>
              </Button>

              <Button
                nativeButton={false}
                variant="ghost"
                size="sm"
                className="w-full justify-between font-normal text-muted-foreground hover:text-foreground"
                render={<Link href={`/calendar/${user.id}`} />}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="size-4" />
                  <span className="text-foreground">A Minha Agenda</span>
                </div>
                <ArrowRight className="size-3.5" />
              </Button>

              <Button
                nativeButton={false}
                variant="ghost"
                size="sm"
                className="w-full justify-between font-normal text-muted-foreground hover:text-foreground"
                render={<Link href="/candidates" />}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="size-4" />
                  <span className="text-foreground">Lista de Candidatos</span>
                </div>
                <ArrowRight className="size-3.5" />
              </Button>

              <Button
                nativeButton={false}
                variant="ghost"
                size="sm"
                className="w-full justify-between font-normal text-muted-foreground hover:text-foreground"
                render={<Link href="/candidates/voting" />}
              >
                <div className="flex items-center gap-2.5">
                  <Vote className="size-4" />
                  <span className="text-foreground">Votações</span>
                </div>
                <ArrowRight className="size-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
