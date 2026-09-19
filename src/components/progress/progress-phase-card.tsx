"use client";

import Link from "next/link";
import { Calendar, CheckCircle2, Clock, Lock, ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  function getStatusBadge() {
    if (checked) {
      return (
        <Badge variant="default" className="gap-1.5 text-xs font-normal">
          <CheckCircle2 className="size-3.5" />
          Concluído
        </Badge>
      );
    }
    if (isAvailable && !isEnded) {
      return (
        <Badge variant="secondary" className="gap-1.5 text-xs font-normal">
          <Clock className="size-3.5" />A decorrer
        </Badge>
      );
    }
    if (isEnded) {
      return (
        <Badge
          variant="outline"
          className="text-xs font-normal text-muted-foreground"
        >
          Terminado
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1.5 text-xs font-normal text-muted-foreground"
      >
        <Lock className="size-3 text-muted-foreground" />
        Brevemente
      </Badge>
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
      className={`transition-colors ${
        checked
          ? "border-border bg-card"
          : isAvailable
            ? "border-primary/40 bg-card shadow-sm"
            : "border-border/60 bg-muted/20 opacity-80"
      }`}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                checked
                  ? "bg-primary text-primary-foreground"
                  : isAvailable
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {checked ? <CheckCircle2 className="size-4" /> : number}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  {title}
                </h3>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
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
              <Button
                size="sm"
                className="w-full sm:w-auto gap-1.5"
                render={<Link href={redirectUrl} />}
              >
                Aceder
                <ArrowRight className="size-3.5" />
              </Button>
            )}
            {checked && redirectUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto text-xs text-muted-foreground"
                render={<Link href={redirectUrl} />}
              >
                Ver detalhes
              </Button>
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
