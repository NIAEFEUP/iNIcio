"use client";

import Link from "next/link";
import { Calendar, CheckCircle2, Lock, ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProgressPhaseCardProps {
  number: number;
  title: string;
  description: string;
  checked?: boolean;
  redirectUrl?: string;
  phaseStart: Date | null;
  phaseEnd: Date | null;
  eventDateText?: string | null;
}

export default function ProgressPhaseCard({
  number,
  title,
  description,
  checked = false,
  redirectUrl,
  phaseEnd,
  phaseStart,
  eventDateText = null,
}: ProgressPhaseCardProps) {
  const isAvailable = Boolean(
    phaseStart && phaseEnd && new Date() > phaseStart,
  );
  const isEnded = Boolean(phaseEnd && new Date() > phaseEnd);

  function renderStatus() {
    if (checked) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5" />
          Concluído
        </span>
      );
    }
    if (isAvailable && !isEnded) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
          <span className="size-2 rounded-full bg-primary animate-pulse" />A
          decorrer
        </span>
      );
    }
    if (isEnded) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-muted-foreground/60" />
          Terminado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Lock className="size-3" />
        Brevemente
      </span>
    );
  }

  function getTimingText() {
    if (!phaseStart) return "Data a anunciar";
    if (checked) return null;
    if (isAvailable && phaseEnd) {
      return `Disponível até ${phaseEnd.toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return `Abre a ${phaseStart.toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  const timingText = getTimingText();

  return (
    <Card
      className={cn(
        "transition-all duration-200 border",
        checked
          ? "border-border/70 bg-card/60"
          : isAvailable && !isEnded
            ? "border-primary/50 bg-card shadow-sm ring-1 ring-primary/20"
            : "border-border/50 bg-muted/20 opacity-85",
      )}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "size-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors",
                checked
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : isAvailable && !isEnded
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-muted text-muted-foreground border border-border/60",
              )}
            >
              {checked ? <CheckCircle2 className="size-4" /> : number}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-semibold text-foreground">
                  {title}
                </h3>
                {renderStatus()}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
                {description}
              </p>

              {timingText && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <Calendar className="size-3.5" />
                  <span>{timingText}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action button if actionable */}
          <div className="sm:self-center shrink-0">
            {isAvailable && !checked && redirectUrl && (
              <Link
                href={redirectUrl}
                className={cn(
                  buttonVariants({
                    size: "sm",
                  }),
                  "w-full sm:w-auto gap-1.5 text-xs",
                )}
              >
                Aceder
                <ArrowRight className="size-3.5" />
              </Link>
            )}
            {checked && redirectUrl && (
              <Link
                href={redirectUrl}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "sm",
                  }),
                  "w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground",
                )}
              >
                Ver Detalhes
              </Link>
            )}
          </div>
        </div>

        {eventDateText && (
          <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-xs text-foreground font-medium">
            <Calendar className="size-4 text-primary" />
            <span>{eventDateText}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
