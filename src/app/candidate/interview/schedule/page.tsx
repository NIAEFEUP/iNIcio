import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, UserCheck } from "lucide-react";

import SchedulingCalendar from "@/components/scheduling/scheduling-calendar";
import { auth } from "@/lib/auth";
import getCandidateWithInterviewAndDynamic from "@/lib/candidate";
import { Slot } from "@/lib/db";
import addInterviewWithSlot from "@/lib/interview";
import {
  getInterviewSlots,
  markInterviewRecruitmentPhaseAsDone,
} from "@/lib/recruitment";
import { getSessionUser } from "@/lib/action-guard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function CandidateInterviewSchedule() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  async function confirm(slots: Array<Slot>) {
    "use server";

    const user = await getSessionUser();

    if (!slots || !Array.isArray(slots) || slots.length === 0) return false;

    try {
      for (const slot of slots.slice(0, 1)) {
        await addInterviewWithSlot(user.id, slot);
        await markInterviewRecruitmentPhaseAsDone(user.id);
      }

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  const candidate = await getCandidateWithInterviewAndDynamic(session.user.id);
  const slots = await getInterviewSlots();

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/candidate/progress"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 -ml-2 text-muted-foreground hover:text-foreground",
          )}
        >
          <ArrowLeft className="size-4" />
          Voltar ao Progresso
        </Link>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <UserCheck className="size-4" />
          Entrevista Individual
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Agendamento de Entrevista
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Seleciona um dos horários disponíveis para realizares a tua entrevista
          com membros do NIAEFEUP. Se já tiveres um horário reservado, podes
          alterá-lo a qualquer momento.
        </p>
      </div>

      <SchedulingCalendar
        slots={slots}
        confirmAction={confirm}
        confirmUrl="/candidate/progress"
        chosenSlot={candidate?.interview?.slot ?? null}
      />
    </div>
  );
}
