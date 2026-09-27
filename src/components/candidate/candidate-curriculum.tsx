"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import type { Application } from "@/lib/db";

export interface CandidateCurriculumProps {
  application: Application;
  candidateId: string;
}

const CandidateCurriculumViewer = dynamic(
  () => import("./candidate-curriculum-viewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">A carregar o currículo...</p>
      </div>
    ),
  },
);

export default function CandidateCurriculum(props: CandidateCurriculumProps) {
  if (!props.application?.curriculum) {
    return <p className="text-center">Não tem currículo.</p>;
  }

  return <CandidateCurriculumViewer candidateId={props.candidateId} />;
}
