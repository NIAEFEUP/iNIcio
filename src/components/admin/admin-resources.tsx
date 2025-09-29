"use client";

import { Candidate, Recruiter } from "@/lib/db";
import ResourceCard from "./resource-card";

import { redirect } from "next/navigation";

interface AdminResourcesProps {
  recruiters: Array<Recruiter>;
  candidates: Array<Candidate>;
}

export default function AdminResources({
  recruiters,
  candidates,
}: AdminResourcesProps) {
  return (
    <>
      <ResourceCard
        title="Recrutamentos"
        quantityText="Gerir recrutamentos"
        onClick={() => redirect("/admin/recruitments")}
      />

      <ResourceCard
        title="Fases de Recrutamento"
        quantityText="Gerir fases"
        onClick={() => redirect("/admin/phases")}
      />

      <ResourceCard
        title="Recrutadores"
        quantityText={`${recruiters.length} recrutadores`}
        onClick={() => redirect("/admin/recruiters")}
      />

      <ResourceCard
        title="Candidatos"
        quantityText={`${candidates.length} candidatos`}
        onClick={() => redirect("/candidates")}
      />

      <ResourceCard
        title="Slots"
        quantityText="Gerir slots"
        onClick={() => redirect("/admin/interviews")}
      />

      <ResourceCard
        title="Calendário"
        quantityText="Visualizar tarefas"
        onClick={() => redirect("/calendar")}
      />

      <ResourceCard
        title="Mensagem Final"
        quantityText="Editar texto de Aceite / Recusado"
        onClick={() => redirect("/messages")}
      />

      <ResourceCard
        title="Passagem de candidatos a membros"
        quantityText="Publicar resultados"
        onClick={() => redirect("/results")}
      />
    </>
  );
}
