"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { redirect, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, Lock } from "lucide-react";

interface ProgressPhaseCardProps {
  number: number;
  title: string;
  description: string;
  checked?: boolean;
  redirectUrl: string;
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
  // const router = useRouter();

  const available = phaseStart && phaseEnd && new Date() > phaseStart;

  function getBackgroundColor() {
    if (checked && available) return "bg-green-50";
    if (!checked && available) return "bg-amber-50";
    if (!available) return "bg-gray-50";
  }

  function getTextColor() {
    if (checked && available) return "text-green-700";
    if (!checked && available) return "text-amber-700";
    if (!available) return "text-gray-700";
  }

  function getBorderColor() {
    if (checked && available) return "border-green-200";
    if (!checked && available) return "border-amber-200";
    if (!available) return "border-gray-200";
  }

  function getIcon() {
    if (checked && available) return <CheckCircle className="h-6 w-6" />;
    if (!checked && available) return <Clock className="h-6 w-6" />;
    if (!available) return <Lock className="h-6 w-6" />;
  }

  function getSoonText() {
    if (phaseStart) {
      return `Abre em ${phaseStart.toLocaleString("pt-PT")}`;
    }

    return "Em breve";
  }

  return (
    <div
      onClick={() => {
        console.log({ checked, available, redirectUrl });
      }}
    >
      <Card className={cn(getBorderColor(), getBackgroundColor())}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8",
                  getTextColor(),
                  getBackgroundColor(),
                  "rounded-full font-bold text-sm",
                )}
              >
                {number}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {title}
                </h3>
                <p className="text-muted-foreground mb-3">{description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {available ? (
                    <p className="font-bold">
                      Até {phaseEnd.toLocaleString("pt-PT")}
                    </p>
                  ) : (
                    <p className="font-bold">{getSoonText()}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">{getIcon()}</div>
          </div>
          {eventDateText && (
            <>
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-green-200">
                <p>{eventDateText}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
