"use client";

import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateClassificationWithValues } from "@/types/classification";
import { useState } from "react";
import {
  CandidateClassification,
  CandidateClassificationValue,
} from "@/lib/db";

interface CandidateClassificationProps {
  candidateId: string;
  classifications: Array<CandidateClassificationWithValues>;
  handleClassificationSave: (
    candidateId: string,
    classification: CandidateClassification,
    classificationValue: CandidateClassificationValue,
  ) => void;
}

export default function CandidateClassificationComponent({
  candidateId,
  classifications,
  handleClassificationSave,
}: CandidateClassificationProps) {
  const [classificationValue, setClassificationValue] =
    useState<CandidateClassificationValue>();

  const getBadgeColor = (severity: number) => {
    if (severity === 1) return "bg-muted text-muted-foreground";

    return "bg-orange-600 text-white";
  };

  console.log(classifications);

  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Classificação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {classifications.map((classification, index) => (
          <div
            key={index}
            className="flex items-center py-2 border-b border-border last:border-0 gap-4"
          >
            <span className="text-sm font-medium text-foreground">
              {classification.name}
            </span>

            <select
              value={classificationValue ? classificationValue.value : ""}
              onChange={(e) => {
                console.log("CLASSIFICATION VALUE: ", classificationValue);
                console.log("CLASSIFICATION2: ", classification);
                setClassificationValue(
                  classification.classificationValues.find(
                    (value) => value.value === e.target.value,
                  ),
                );
                handleClassificationSave(
                  candidateId,
                  classification,
                  classificationValue,
                );
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary min-w-[70px] text-center`}
            >
              {classification.classificationValues.map((value, index) => (
                <option key={index} value={`${JSON.stringify(value)}`}>
                  {value.value}
                </option>
              ))}
            </select>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
