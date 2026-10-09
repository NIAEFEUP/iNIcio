import { finalMessageTemplate, recruitmentPhase } from "@/db/schema";
import { db, FinalMessageTemplate } from "./db";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import {
  getLatestVotingDecisionForCandidate,
  getLatestVotingDecisionsByRecruitment,
} from "./voting";
import { getUserApplications } from "./application";
import { getActiveRecruitment, getRecruitmentPhases } from "./recruitment";
import {
  getPhaseState,
  normalizePhaseIdentifier,
  RECRUITMENT_PHASE_IDENTIFIERS,
} from "./recruitment-state";

export type CandidateRecruitmentResult = {
  recruitmentId: number;
  recruitmentTitle: string;
  lectiveYear: string | null;
  semester: number | null;
  isCurrent: boolean;
  decision: "approved" | "rejected" | "pending";
  content: Array<unknown>;
};

const RESULT_PHASE_IDENTIFIER = RECRUITMENT_PHASE_IDENTIFIERS.result;

/**
 * Whether the candidate-facing "resultado" phase of a recruitment has started.
 * A finalized result is only revealed when that phase is no longer upcoming.
 * When no "resultado" phase is configured, the result is not gated.
 */
export async function canRevealCandidateResult(
  recruitmentId: number,
  now: Date = new Date(),
): Promise<boolean> {
  const phases = await getRecruitmentPhases("candidate", recruitmentId);
  const resultPhase = phases.find(
    (phase) =>
      normalizePhaseIdentifier(phase.clientIdentifier) ===
      RESULT_PHASE_IDENTIFIER,
  );

  if (!resultPhase) return true;

  return getPhaseState(resultPhase, now) !== "upcoming";
}

export async function getMessage(candidateId: string, recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;

  if (!targetId || !(await canRevealCandidateResult(targetId))) {
    return null;
  }

  const result = await getLatestVotingDecisionForCandidate(
    candidateId,
    targetId,
  );

  if (!result) return null;

  if (result.decision === "reject") {
    return {
      decision: "rejected" as const,
      message: await getRejectedMessage(targetId),
    };
  } else {
    return {
      decision: "approved" as const,
      message: await getAcceptedMessage(targetId),
    };
  }
}

export async function getAllCandidateResults(
  candidateId: string,
): Promise<CandidateRecruitmentResult[]> {
  const userApps = await getUserApplications(candidateId);
  if (userApps.length === 0) return [];

  const recruitmentIds = [...new Set(userApps.map((a) => a.recruitmentId))];

  // Batched lookup for active recruitment, voting decisions, reveal phases,
  // and all relevant message templates (both recruitment-specific and default fallbacks).
  const [activeRec, decisions, revealPhases, allTemplates] = await Promise.all([
    getActiveRecruitment(),
    getLatestVotingDecisionsByRecruitment(candidateId, recruitmentIds),
    db
      .select()
      .from(recruitmentPhase)
      .where(
        and(
          inArray(recruitmentPhase.recruitmentId, recruitmentIds),
          eq(recruitmentPhase.role, "candidate"),
        ),
      )
      .orderBy(recruitmentPhase.start),
    db
      .select()
      .from(finalMessageTemplate)
      .where(
        or(
          inArray(finalMessageTemplate.recruitmentId, recruitmentIds),
          isNull(finalMessageTemplate.recruitmentId),
        ),
      ),
  ]);

  const defaultAccepted =
    allTemplates.find((t) => t.type === "approved" && !t.recruitmentId) ??
    allTemplates.find((t) => t.type === "approved");

  const defaultRejected =
    allTemplates.find((t) => t.type === "rejected" && !t.recruitmentId) ??
    allTemplates.find((t) => t.type === "rejected");

  const acceptedByRec = new Map<number, (typeof allTemplates)[0]>();
  const rejectedByRec = new Map<number, (typeof allTemplates)[0]>();
  for (const t of allTemplates) {
    if (t.recruitmentId) {
      if (t.type === "approved") acceptedByRec.set(t.recruitmentId, t);
      if (t.type === "rejected") rejectedByRec.set(t.recruitmentId, t);
    }
  }

  // A result is revealed unless the recruitment has an upcoming "resultado" phase.
  const canReveal = new Map<number, boolean>(
    recruitmentIds.map((id) => [id, true]),
  );
  const seenResultPhases = new Set<number>();
  for (const phase of revealPhases) {
    if (
      normalizePhaseIdentifier(phase.clientIdentifier) !==
        RESULT_PHASE_IDENTIFIER ||
      seenResultPhases.has(phase.recruitmentId)
    )
      continue;

    seenResultPhases.add(phase.recruitmentId);
    canReveal.set(phase.recruitmentId, getPhaseState(phase) !== "upcoming");
  }

  return userApps.map((app) => {
    const isCurrent =
      activeRec?.id != null && app.recruitmentId === activeRec.id;
    const votingDecision = decisions.get(app.recruitmentId);

    const revealed = canReveal.get(app.recruitmentId) ?? true;

    if (!votingDecision || !revealed) {
      return {
        recruitmentId: app.recruitmentId,
        recruitmentTitle:
          app.recruitment?.title ?? `Recrutamento #${app.recruitmentId}`,
        lectiveYear: app.recruitment?.lectiveYear ?? null,
        semester: app.recruitment?.semester ?? null,
        isCurrent,
        decision: "pending" as const,
        content: [] as Array<unknown>,
      };
    }

    const approved = votingDecision.decision !== "reject";
    const template = approved
      ? (acceptedByRec.get(app.recruitmentId) ?? defaultAccepted)
      : (rejectedByRec.get(app.recruitmentId) ?? defaultRejected);

    return {
      recruitmentId: app.recruitmentId,
      recruitmentTitle:
        app.recruitment?.title ?? `Recrutamento #${app.recruitmentId}`,
      lectiveYear: app.recruitment?.lectiveYear ?? null,
      semester: app.recruitment?.semester ?? null,
      isCurrent,
      decision: approved ? ("approved" as const) : ("rejected" as const),
      content: (template?.content ?? []) as Array<unknown>,
    };
  });
}

export async function getAcceptedMessage(recruitmentId?: number) {
  if (recruitmentId) {
    const specific = await db.query.finalMessageTemplate.findFirst({
      where: and(
        eq(finalMessageTemplate.type, "approved"),
        eq(finalMessageTemplate.recruitmentId, recruitmentId),
      ),
    });
    if (specific) return specific;
  }

  const defaultMsg = await db.query.finalMessageTemplate.findFirst({
    where: and(
      eq(finalMessageTemplate.type, "approved"),
      isNull(finalMessageTemplate.recruitmentId),
    ),
  });
  if (defaultMsg) return defaultMsg;

  return db.query.finalMessageTemplate.findFirst({
    where: eq(finalMessageTemplate.type, "approved"),
  });
}

export async function getRejectedMessage(recruitmentId?: number) {
  if (recruitmentId) {
    const specific = await db.query.finalMessageTemplate.findFirst({
      where: and(
        eq(finalMessageTemplate.type, "rejected"),
        eq(finalMessageTemplate.recruitmentId, recruitmentId),
      ),
    });
    if (specific) return specific;
  }

  const defaultMsg = await db.query.finalMessageTemplate.findFirst({
    where: and(
      eq(finalMessageTemplate.type, "rejected"),
      isNull(finalMessageTemplate.recruitmentId),
    ),
  });
  if (defaultMsg) return defaultMsg;

  return db.query.finalMessageTemplate.findFirst({
    where: eq(finalMessageTemplate.type, "rejected"),
  });
}

export async function addAcceptedMessageTemplate(
  content: Array<any>,
  recruitmentId?: number,
) {
  if (content.length === 0) return;

  await db.transaction(async (trx) => {
    const whereClause = recruitmentId
      ? and(
          eq(finalMessageTemplate.type, "approved"),
          eq(finalMessageTemplate.recruitmentId, recruitmentId),
        )
      : and(
          eq(finalMessageTemplate.type, "approved"),
          isNull(finalMessageTemplate.recruitmentId),
        );

    const template = await trx.query.finalMessageTemplate.findFirst({
      where: whereClause,
    });

    if (template) {
      await trx
        .update(finalMessageTemplate)
        .set({ content })
        .where(eq(finalMessageTemplate.id, template.id));
    } else {
      await trx.insert(finalMessageTemplate).values({
        content,
        type: "approved",
        recruitmentId: recruitmentId ?? null,
      });
    }
  });
}

export async function addRejectedMessageTemplate(
  content: Array<any>,
  recruitmentId?: number,
) {
  if (content.length === 0) return;

  await db.transaction(async (trx) => {
    const whereClause = recruitmentId
      ? and(
          eq(finalMessageTemplate.type, "rejected"),
          eq(finalMessageTemplate.recruitmentId, recruitmentId),
        )
      : and(
          eq(finalMessageTemplate.type, "rejected"),
          isNull(finalMessageTemplate.recruitmentId),
        );

    const template = await trx.query.finalMessageTemplate.findFirst({
      where: whereClause,
    });

    if (template) {
      await trx
        .update(finalMessageTemplate)
        .set({ content })
        .where(eq(finalMessageTemplate.id, template.id));
    } else {
      await trx.insert(finalMessageTemplate).values({
        content,
        type: "rejected",
        recruitmentId: recruitmentId ?? null,
      });
    }
  });
}

export async function getAcceptedMessageTemplate(
  recruitmentId?: number,
): Promise<FinalMessageTemplate> {
  const template = (await getAcceptedMessage(
    recruitmentId,
  )) as FinalMessageTemplate | null;

  if (!template) {
    return {
      id: 0,
      recruitmentId: recruitmentId ?? null,
      content: [],
      type: "approved",
    };
  }

  return template;
}

export async function getRejectedMessageTemplate(
  recruitmentId?: number,
): Promise<FinalMessageTemplate> {
  const template = (await getRejectedMessage(
    recruitmentId,
  )) as FinalMessageTemplate | null;

  if (!template) {
    return {
      id: 1,
      recruitmentId: recruitmentId ?? null,
      content: [],
      type: "rejected",
    };
  }

  return template;
}
