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
}

export default function ProgressPhaseCard({
  number,
  title,
  description,
  width = 128,
  checked = false,
  redirectUrl,
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
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
