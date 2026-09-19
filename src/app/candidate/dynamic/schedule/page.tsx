import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

import SchedulingCalendar from "@/components/scheduling/scheduling-calendar";
import { auth } from "@/lib/auth";
import getCandidateWithInterviewAndDynamic from "@/lib/candidate";
import { Slot } from "@/lib/db";
import { tryToAddCandidateToDynamic } from "@/lib/dynamic";
import {
  getDynamicSlots,
  markDynamicRecruitmentPhaseAsDone,
} from "@/lib/recruitment";
import { getSessionUser } from "@/lib/action-guard";
import { Button } from "@/components/ui/button";

export default async function CandidateDynamicSchedule() {
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
        await tryToAddCandidateToDynamic(user.id, slot);
        await markDynamicRecruitmentPhaseAsDone(user.id);
      }

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  const candidate = await getCandidateWithInterviewAndDynamic(session.user.id);
  const slots = await getDynamicSlots();

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/candidate/progress" />}
          className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao Progresso
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Users className="size-4 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Marcação de Dinâmica de Grupo
          </h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          Escolhe uma sessão para participares na dinâmica de grupo com outros
          candidatos e membros do NIAEFEUP.
        </p>
      </div>

      <SchedulingCalendar
        confirmAction={confirm}
        slots={slots}
        confirmUrl="/candidate/progress"
        chosenSlot={candidate?.dynamic?.dynamic?.slot}
      />
    </div>
  );
}
