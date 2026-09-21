import { finalMessageTemplate } from "@/db/schema";
import { db, FinalMessageTemplate } from "./db";
import { eq } from "drizzle-orm";
import { getLatestVotingDecisionForCandidate } from "./voting";
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
  const activeRec = await getActiveRecruitment();

  const results: CandidateRecruitmentResult[] = [];

  for (const app of userApps) {
    const isCurrent =
      activeRec?.id != null && app.recruitmentId === activeRec.id;
    const votingDecision = await getLatestVotingDecisionForCandidate(
      candidateId,
      app.recruitmentId,
    );

    let decision: "approved" | "rejected" | "pending" = "pending";
    let messageContent: Array<unknown> = [];

    if (votingDecision && (await canRevealCandidateResult(app.recruitmentId))) {
      if (votingDecision.decision === "reject") {
        decision = "rejected";
        const msg = await getRejectedMessage();
        messageContent = (msg?.content ?? []) as Array<unknown>;
      } else {
        decision = "approved";
        const msg = await getAcceptedMessage();
        messageContent = (msg?.content ?? []) as Array<unknown>;
      }
    }

    results.push({
      recruitmentId: app.recruitmentId,
      recruitmentTitle:
        app.recruitment?.title ?? `Recrutamento #${app.recruitmentId}`,
      lectiveYear: app.recruitment?.lectiveYear ?? null,
      semester: app.recruitment?.semester ?? null,
      isCurrent,
      decision,
      content: messageContent,
    });
  }

  return results;
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
