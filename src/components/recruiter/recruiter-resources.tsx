"use client";

import ResourceCard from "@/components/admin/resource-card";

import { redirect } from "next/navigation";

interface RecruiterResourcesProps {
  userId: string;
}

export default function RecruiterResources({
  userId,
}: RecruiterResourcesProps) {
  return (
    <div>
      <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <ResourceCard
          title="Progresso"
          quantityText="Ver tarefas por concluir"
          onClick={() => redirect("/recruiter/progress")}
        />

        <ResourceCard
          title="Disponibilidades"
          quantityText="Marcar horários disponíveis"
          onClick={() => redirect("/recruiter/availability")}
        />

        <ResourceCard
          title="Candidatos"
          quantityText="Ver candidaturas"
          onClick={() => redirect("/candidates")}
        />

        <ResourceCard
          title="Votações"
          quantityText="Votações em curso"
          onClick={() => redirect("/candidates/voting")}
        />

        <ResourceCard
          title="Alocações"
          quantityText="Visualizar calendário"
          onClick={() => redirect(`/calendar/${userId}`)}
        />
      </div>
    </div>
  );
}
