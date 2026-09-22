"use client";

import { User } from "@/lib/db";
import ResourceCard from "@/components/common/resource-card";

interface AdminResourcesProps {
  recruiters: Array<{ userId: string }>;
  candidates: Array<User>;
  userId: string;
}

export default function AdminResources({
  recruiters,
  candidates,
  userId,
}: AdminResourcesProps) {
  return (
    <div>
      <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <ResourceCard
          title="Disponibilidades"
          quantityText="Ver disponibilidades"
          href="/admin/availabilities"
        />

        <ResourceCard
          title="Recrutamentos"
          quantityText="Gerir recrutamentos"
          href="/admin/recruitments"
        />

        <ResourceCard
          title="Fases de Recrutamento"
          quantityText="Gerir fases"
          href="/admin/phases"
        />

        <ResourceCard
          title="Recrutadores"
          quantityText={`${recruiters.length} recrutadores`}
          href="/admin/recruiters"
        />

        <ResourceCard
          title="Candidatos"
          quantityText={`${candidates.length} candidatos`}
          href="/candidates"
        />

        <ResourceCard
          title="Slots"
          quantityText="Gerir slots"
          href="/admin/interviews"
        />

        <ResourceCard
          title="Templates"
          quantityText="Adicionar templates de entrevistas e dinâmicas"
          href="/admin/templates"
        />

        <ResourceCard
          title="Calendário"
          quantityText="Visualizar tarefas"
          href={`/calendar/${userId}`}
        />

        <ResourceCard
          title="Mensagem Final"
          quantityText="Editar texto de Aceite / Recusado"
          href="/admin/final-messages"
        />
      </div>
    </div>
  );
}
