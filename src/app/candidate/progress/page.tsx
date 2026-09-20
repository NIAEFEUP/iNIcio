import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, or } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slot } from "@/db/schema";
import {
  getUserApplications,
  getApplicationInterests,
  type UserApplicationWithDetails,
} from "@/lib/application";
import getCandidateWithInterviewAndDynamic from "@/lib/candidate";
import { getFilenameUrl } from "@/lib/file-upload";
import { getAllCandidateResults } from "@/lib/final-messages";
import {
  getActiveRecruitment,
  getRecruitmentPhases,
  isRecruitmentPhaseDone,
} from "@/lib/recruitment";
import { getRecruitmentPhaseKind } from "@/lib/recruitment-state";
import {
  CandidateProgressView,
  type CandidatePhaseViewData,
  type CandidateSlotData,
} from "@/components/candidate/candidate-progress-view";
import type { CandidateSlotOption } from "@/components/candidate/candidate-schedule-modal";

type CandidateProgressProps = {
  searchParams?: Promise<{ recruitmentId?: string }>;
};

export default async function CandidateProgress({
  searchParams,
}: CandidateProgressProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const targetRecruitmentId = resolvedSearchParams?.recruitmentId
    ? Number(resolvedSearchParams.recruitmentId)
    : undefined;

  const activeRecruitment = await getActiveRecruitment();

  if (!activeRecruitment) {
    redirect("/");
  }

  if (targetRecruitmentId && targetRecruitmentId !== activeRecruitment.id) {
    redirect("/");
  }

  const userApps = await getUserApplications(session.user.id);
  const currentApp =
    userApps.find((app) => app.recruitmentId === activeRecruitment.id) ?? null;

  if (!currentApp) {
    redirect("/");
  }

  const [interests, curriculumUrl, candidateResults, candidateInfo] =
    await Promise.all([
      getApplicationInterests(currentApp),
      getFilenameUrl(currentApp.curriculum),
      getAllCandidateResults(session.user.id),
      getCandidateWithInterviewAndDynamic(
        session.user.id,
        activeRecruitment.id,
      ),
    ]);

  const currentResult =
    candidateResults.find((r) => r.recruitmentId === activeRecruitment.id) ??
    null;

  const applicationWithDetails: UserApplicationWithDetails = {
    ...currentApp,
    curriculum: curriculumUrl,
    interests,
    result: currentResult,
  };

  const rawPhases = await getRecruitmentPhases(
    "candidate",
    activeRecruitment.id,
  );

  const progressPhases: CandidatePhaseViewData[] = await Promise.all(
    rawPhases.map(async (phase) => {
      const kind = getRecruitmentPhaseKind(phase);
      let checked = false;

      if (kind === "application") {
        checked = true;
      } else if (kind === "interview" || kind === "dynamic") {
        checked = await isRecruitmentPhaseDone(session.user.id, phase.id);
      } else if (
        kind === "voting" ||
        phase.clientIdentifier.trim().toLowerCase() === "resultado"
      ) {
        checked = Boolean(
          currentResult &&
          (currentResult.decision === "approved" ||
            currentResult.decision === "rejected"),
        );
      } else {
        checked = await isRecruitmentPhaseDone(session.user.id, phase.id);
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
    }),
  );

  const currentInterviewSlotId = candidateInfo?.interview?.slot?.id;
  const currentDynamicSlotId = candidateInfo?.dynamic?.dynamic?.slot?.id;

  // Query available slots including currently booked slot so candidate can view and switch
  const [rawInterviewSlots, rawDynamicSlots] = await Promise.all([
    db
      .select()
      .from(slot)
      .where(
        and(
          eq(slot.type, "interview"),
          eq(slot.recruitmentId, activeRecruitment.id),
          currentInterviewSlotId
            ? or(gt(slot.quantity, 0), eq(slot.id, currentInterviewSlotId))
            : gt(slot.quantity, 0),
        ),
      )
      .orderBy(slot.start),
    db
      .select()
      .from(slot)
      .where(
        and(
          eq(slot.type, "dynamic"),
          eq(slot.recruitmentId, activeRecruitment.id),
          currentDynamicSlotId
            ? or(gt(slot.quantity, 0), eq(slot.id, currentDynamicSlotId))
            : gt(slot.quantity, 0),
        ),
      )
      .orderBy(slot.start),
  ]);

  const interviewSlots: CandidateSlotOption[] = rawInterviewSlots.map((s) => ({
    id: s.id,
    start: s.start.toISOString(),
    duration: s.duration,
    quantity: s.quantity,
  }));

  const dynamicSlots: CandidateSlotOption[] = rawDynamicSlots.map((s) => ({
    id: s.id,
    start: s.start.toISOString(),
    duration: s.duration,
    quantity: s.quantity,
  }));

  const interviewSlot: CandidateSlotData | null = candidateInfo?.interview?.slot
    ? {
        id: candidateInfo.interview.slot.id,
        start: candidateInfo.interview.slot.start.toISOString(),
        duration: candidateInfo.interview.slot.duration,
      }
    : null;

  const dynamicSlot: CandidateSlotData | null = candidateInfo?.dynamic?.dynamic
    ?.slot
    ? {
        id: candidateInfo.dynamic.dynamic.slot.id,
        start: candidateInfo.dynamic.dynamic.slot.start.toISOString(),
        duration: candidateInfo.dynamic.dynamic.slot.duration,
      }
    : null;

  return (
    <CandidateProgressView
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      recruitment={{
        id: activeRecruitment.id,
        title: activeRecruitment.title,
        lectiveYear: activeRecruitment.lectiveYear ?? null,
        semester: activeRecruitment.semester ?? null,
        start: activeRecruitment.start.toISOString(),
        end: activeRecruitment.end.toISOString(),
      }}
      phases={progressPhases}
      application={applicationWithDetails}
      result={currentResult}
      interviewSlot={interviewSlot}
      dynamicSlot={dynamicSlot}
      interviewSlots={interviewSlots}
      dynamicSlots={dynamicSlots}
    />
  );
}
