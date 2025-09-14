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

interface ProgressPhaseCardProps {
  number: number;
  title: string;
  description: string;
  width?: number;
  onClick?: () => void;
  checked?: boolean;
}

export default function ProgressPhaseCard({
  number,
  title,
  description,
  width = 128,
  onClick = () => {},
  checked = false,
}: ProgressPhaseCardProps) {
  return (
    <>
      <Card
        className={cn("", `w-${width}`)}
        onClick={() => {
          if (!checked) onClick();
        }}
      >
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
    </>
  );
}
