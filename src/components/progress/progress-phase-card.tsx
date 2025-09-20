"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { redirect } from "next/navigation";

interface ProgressPhaseCardProps {
  number: number;
  title: string;
  description: string;
  width?: number;
  checked?: boolean;
  redirectUrl: string;
  phaseStart: Date | null;
  phaseEnd: Date | null;
}

export default function ProgressPhaseCard({
  number,
  title,
  description,
  width = 128,
  checked = false,
  redirectUrl,
  phaseStart,
  phaseEnd,
}: ProgressPhaseCardProps) {
  return (
    <div
      onClick={() => {
        if (!checked) redirect(redirectUrl);
      }}
    >
      <Card className={cn("", `w-${width}`)}>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>
            {number}. {title}
          </CardTitle>
          <Checkbox checked={checked} disabled={!checked} />
        </CardHeader>
        <CardContent>
          <CardDescription className="flex flex-col gap-y-2">
            <span>{description}</span>
            {phaseEnd && (
              <span className="font-bold">
                Até {phaseEnd.toLocaleString("pt-PT")}
              </span>
            )}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
