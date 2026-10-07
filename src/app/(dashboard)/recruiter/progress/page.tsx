import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  candidate,
  recruiterToDynamic,
  recruiterToInterview,
  recruitmentPhaseStatus,
  votingPhase,
} from "@/db/schema";
import { and, count, eq } from "drizzle-orm";
import { getTargetRecruitment } from "@/lib/selected-recruitment";
import { getAvailabilities, isRecruiter } from "@/lib/recruiter";
import { getRecruitmentPhases } from "@/lib/recruitment";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  RecruiterProgressView,
  type RecruiterEventData,
  type RecruiterPhaseViewData,
} from "@/components/recruiter/recruiter-progress-view";

export default async function RecruiterProgress() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const targetRecruitment = await getTargetRecruitment();

  if (!targetRecruitment) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Progresso" />
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            Não existe um recrutamento selecionado ou ativo.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!(await isRecruiter(session.user.id, targetRecruitment.id))) {
    redirect("/");
  }

  const [
    rawPhases,
    userAvailabilities,
    [candidateCountResult],
    [votingPhasesCountResult],
    donePhaseStatuses,
    assignedInterviews,
    assignedDynamics,
  ] = await Promise.all([
    getRecruitmentPhases("recruiter", targetRecruitment.id),
    getAvailabilities(session.user.id, targetRecruitment.id),
    db
      .select({ count: count() })
      .from(candidate)
      .where(eq(candidate.recruitmentId, targetRecruitment.id)),
    db
      .select({ count: count() })
      .from(votingPhase)
      .where(eq(votingPhase.recruitmentId, targetRecruitment.id)),
    db
      .select({ phaseId: recruitmentPhaseStatus.phaseId })
      .from(recruitmentPhaseStatus)
      .where(
        and(
          eq(recruitmentPhaseStatus.userId, session.user.id),
          eq(recruitmentPhaseStatus.status, "done"),
        ),
      ),
    db.query.interview.findMany({
      where: (i, { exists, and: andWhere, eq: eqWhere }) =>
        andWhere(
          eqWhere(i.recruitmentId, targetRecruitment.id),
          exists(
            db
              .select()
              .from(recruiterToInterview)
              .where(
                and(
                  eq(recruiterToInterview.interviewId, i.id),
                  eq(recruiterToInterview.recruiterId, session.user.id),
                ),
              ),
          ),
        ),
      columns: {
        id: true,
        candidateId: true,
      },
      with: {
        slot: true,
        candidate: {
          columns: {
            userId: true,
          },
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    }),
    db.query.dynamic.findMany({
      where: (d, { exists, and: andWhere, eq: eqWhere }) =>
        andWhere(
          eqWhere(d.recruitmentId, targetRecruitment.id),
          exists(
            db
              .select()
              .from(recruiterToDynamic)
              .where(
                and(
                  eq(recruiterToDynamic.dynamicId, d.id),
                  eq(recruiterToDynamic.recruiterId, session.user.id),
                ),
              ),
          ),
        ),
      columns: {
        id: true,
      },
      with: {
        slot: true,
        candidates: {
          columns: {
            candidateId: true,
            dynamicId: true,
          },
        },
      },
    }),
  ]);

  const donePhaseIds = new Set(donePhaseStatuses.map((s) => s.phaseId));

  const progressPhases: RecruiterPhaseViewData[] = rawPhases.map((phase) => {
    const ident = phase.clientIdentifier.trim().toLowerCase();
    let checked = false;

    if (
      ident === "availability" ||
      ident === "recruiter_availability" ||
      ident === "disponibilidade"
    ) {
      checked = userAvailabilities.length > 0;
    } else {
      checked = donePhaseIds.has(phase.id);
    }

    return {
      id: phase.id,
      title: phase.title,
      description: phase.description,
      clientIdentifier: phase.clientIdentifier,
      start: phase.start ? phase.start.toISOString() : null,
      end: phase.end ? phase.end.toISOString() : null,
      checked,
    };
  });

  const events: RecruiterEventData[] = [
    ...assignedInterviews
      .filter((i) => i.slot?.start)
      .map((i) => ({
        id: `interview-${i.id}`,
        type: "interview" as const,
        title: `Entrevista com ${i.candidate?.user?.name || "Candidato"}`,
        candidateName: i.candidate?.user?.name || "Candidato",
        candidateImage: i.candidate?.user?.image,
        start: i.slot.start.toISOString(),
        duration: i.slot.duration,
        link: `/candidate/${i.candidateId}/interview`,
      })),
    ...assignedDynamics
      .filter((d) => d.slot?.start)
      .map((d) => ({
        id: `dynamic-${d.id}`,
        type: "dynamic" as const,
        title: `Dinâmica de Grupo (${d.candidates.length} candidatos)`,
        candidateName: `Dinâmica (${d.candidates.length} candidatos)`,
        candidateImage: null,
        start: d.slot.start.toISOString(),
        duration: d.slot.duration,
        link: `/dynamic/${d.id}`,
      })),
  ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const isActive = (val: boolean | string) => val === true || val === "true";

  return (
    <RecruiterProgressView
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      recruitment={{
        id: targetRecruitment.id,
        title: targetRecruitment.title,
        lectiveYear: targetRecruitment.lectiveYear ?? null,
        semester: targetRecruitment.semester ?? null,
        start: targetRecruitment.start.toISOString(),
        end: targetRecruitment.end.toISOString(),
        active: isActive(targetRecruitment.active),
      }}
      phases={progressPhases}
      events={events}
      stats={{
        candidatesCount: candidateCountResult?.count ?? 0,
        availabilitiesCount: userAvailabilities.length,
        votingPhasesCount: votingPhasesCountResult?.count ?? 0,
      }}
    />
  );
}
