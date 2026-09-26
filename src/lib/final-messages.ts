import { finalMessageTemplate, recruitmentPhase } from "@/db/schema";
import { db, FinalMessageTemplate } from "./db";
import { and, eq, inArray } from "drizzle-orm";
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
      message: await getRejectedMessage(),
    };
  } else {
    return {
      decision: "approved" as const,
      message: await getAcceptedMessage(),
    };
  }
}

export async function getAllCandidateResults(
  candidateId: string,
): Promise<CandidateRecruitmentResult[]> {
  const userApps = await getUserApplications(candidateId);
  if (userApps.length === 0) return [];

  const recruitmentIds = [...new Set(userApps.map((a) => a.recruitmentId))];

  // One batched lookup each for the active recruitment, the voting decisions
  // (per recruitment), the reveal phases and the message templates, instead of
  // one set of queries per application.
  const [activeRec, decisions, revealPhases, accepted, rejected] =
    await Promise.all([
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
      getAcceptedMessage(),
      getRejectedMessage(),
    ]);

  // A result is revealed unless the recruitment has an upcoming "resultado"
  // phase.
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
    const template = approved ? accepted : rejected;

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

export async function getAcceptedMessage() {
  const message = await db
    .select()
    .from(finalMessageTemplate)
    .where(eq(finalMessageTemplate.type, "approved"));
  return message[0];
}

export async function getRejectedMessage() {
  const message = await db
    .select()
    .from(finalMessageTemplate)
    .where(eq(finalMessageTemplate.type, "rejected"));
  return message[0];
}

export async function addAcceptedMessageTemplate(content: Array<any>) {
  if (content.length === 0) return;

  await db.transaction(async (trx) => {
    const template = await trx.query.finalMessageTemplate.findFirst({
      where: eq(finalMessageTemplate.type, "approved"),
    });
    if (template) {
      await trx
        .update(finalMessageTemplate)
        .set({ content: content })
        .where(eq(finalMessageTemplate.id, template.id));
    } else {
      await trx
        .insert(finalMessageTemplate)
        .values({ content: content, type: "approved" });
    }
  });
}

export async function addRejectedMessageTemplate(content: Array<any>) {
  if (content.length === 0) return;

  await db.transaction(async (trx) => {
    const template = await trx.query.finalMessageTemplate.findFirst({
      where: eq(finalMessageTemplate.type, "rejected"),
    });
    if (template) {
      await trx
        .update(finalMessageTemplate)
        .set({ content: content })
        .where(eq(finalMessageTemplate.id, template.id));
    } else {
      await trx
        .insert(finalMessageTemplate)
        .values({ content: content, type: "rejected" });
    }
  });
}

export async function getAcceptedMessageTemplate(): Promise<FinalMessageTemplate> {
  const template = (await db.query.finalMessageTemplate.findFirst({
    where: eq(finalMessageTemplate.type, "approved"),
  })) as FinalMessageTemplate;

  if (!template) {
    return {
      id: 0,
      content: [],
      type: "approved",
    };
  }

  return template;
}

export async function getRejectedMessageTemplate(): Promise<FinalMessageTemplate> {
  const template = (await db.query.finalMessageTemplate.findFirst({
    where: eq(finalMessageTemplate.type, "rejected"),
  })) as FinalMessageTemplate;

  if (!template) {
    return {
      id: 1,
      content: [],
      type: "rejected",
    };
  }

  return template;
}
