"use client";

import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateClassification } from "@/lib/db";

interface CandidateClassificationProps {
  classifications: CandidateClassification[];
}

export function CandidateClassificationComponent({
  classifications,
}: CandidateClassificationProps) {
  const handleValueChange = (index: number, value: string) => {};

  const getBadgeColor = (value: number | null) => {
    if (value === null) return "bg-muted text-muted-foreground";
    if (value === 5) return "bg-emerald-600 text-white";
    if (value === 4) return "bg-amber-600 text-white";
    return "bg-orange-600 text-white";
  };

  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Classificação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {classifications.map((skill, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground">{/*skill.icon*/}</div>
              <span className="text-sm font-medium text-foreground">
                {/* {skill.label} */}
              </span>
            </div>
            <select
              value={skill.value ?? ""}
              onChange={(e) => handleValueChange(index, e.target.value)}
              className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary min-w-[70px] text-center ${getBadgeColor(skill.value)}`}
            >
              <option value="">Empty</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
