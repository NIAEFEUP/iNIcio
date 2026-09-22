"use client";

import ResourceCard from "@/components/admin/resource-card";

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
          href="/recruiter/progress"
        />

        <ResourceCard
          title="Disponibilidades"
          quantityText="Marcar horários disponíveis"
          href="/recruiter/availability"
        />

        <ResourceCard
          title="Candidatos"
          quantityText="Ver candidaturas"
          href="/candidates"
        />

        <ResourceCard
          title="Votações"
          quantityText="Votações em curso"
          href="/candidates/voting"
        />

        <ResourceCard
          title="Alocações"
          quantityText="Visualizar calendário"
          href={`/calendar/${userId}`}
        />
      </div>
    </div>
  );
}
