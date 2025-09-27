"use client";

import { Application } from "@/lib/db";

interface CandidateCurriculumProps {
  application: Application;
}

export default function CandidateCurriculum({
  application,
}: CandidateCurriculumProps) {
  return application?.curriculum ? (
    <object data={application.curriculum} className="w-full h-full">
      <p>
        O PDF não foi possível de renderizar.{" "}
        <a href={application.curriculum}>Descarrega</a>.
      </p>
    </object>
  ) : (
    <p className="text-center">Não tem currículo.</p>
  );
}
