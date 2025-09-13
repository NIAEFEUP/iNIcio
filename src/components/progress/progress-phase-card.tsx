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
}

export default function ProgressPhaseCard({
  number,
  title,
  description,
  width = 128,
  onClick = () => {},
}: ProgressPhaseCardProps) {
  return (
    <>
      <Card className={cn("", `w-${width}`)} onClick={onClick}>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>
            {number}. {title}
          </CardTitle>
          <Checkbox disabled />
        </CardHeader>
        <CardContent>
          <CardDescription>{description}</CardDescription>
        </CardContent>
      </Card>
    </>
  );
}
