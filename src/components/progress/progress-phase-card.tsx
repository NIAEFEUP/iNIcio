"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { redirect, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock } from "lucide-react";

interface ProgressPhaseCardProps {
  number: number;
  title: string;
  description: string;
  checked?: boolean;
  redirectUrl: string;
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
  eventDateText = null,
}: ProgressPhaseCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => {
        if (!checked) redirect(redirectUrl);
      }}
    >
      <Card
        className={cn(
          checked
            ? "border-green-200 bg-green-50/50"
            : "border-amber-200 bg-amber-50/50",
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8",
                  checked
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700",
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
                  <span>Até {phaseEnd.toLocaleString("pt-PT")}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {checked ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <Clock className="h-6 w-6 text-amber-500" />
              )}
            </div>
          </div>
          {eventDateText && (
            <>
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-green-200">
                <p>{eventDateText}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => {
                    router.push(`${redirectUrl}`);
                  }}
                >
                  Reagendar {title}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
