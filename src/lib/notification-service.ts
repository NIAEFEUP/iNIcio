import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { notification } from "@/db/schema";
import { db } from "./db";
import { getUserApplications } from "./application";
import { getRecruitmentPhases } from "./recruitment";
import {
  getPhaseState,
  normalizePhaseIdentifier,
  RECRUITMENT_PHASE_IDENTIFIERS,
} from "./recruitment-state";
import { canRevealCandidateResult } from "./final-messages";
import { getLatestVotingDecisionForCandidate } from "./voting";

/** Candidate-facing phases that we announce when they open. */
const UNLOCKABLE_PHASE_IDENTIFIERS: string[] = [
  RECRUITMENT_PHASE_IDENTIFIERS.interview,
  RECRUITMENT_PHASE_IDENTIFIERS.dynamic,
];

function toData(data: unknown): Record<string, unknown> {
  return (data ?? {}) as Record<string, unknown>;
}

function dataRecruitmentId(data: unknown): number | null {
  const value = toData(data).recruitmentId;
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return null;
}

function dataIdentifier(data: unknown): string {
  const value = toData(data).identifier;
  return typeof value === "string" ? value : "";
}

/**
 * Creates notifications whose conditions have just become true for a
 * candidate, without duplicating existing ones:
 * - `voting`: only when the finalized decision may be revealed (the
 *   "resultado" phase has started), so candidates never learn the outcome
 *   before the reveal period.
 * - `phase_unlocked`: when a candidate-facing phase (entrevista, dinâmica)
 *   is currently open.
 *
 * Safe to call on every poll; it only inserts rows that do not exist yet.
 */
export async function deliverPendingNotifications(userId: string) {
  const apps = await getUserApplications(userId);
  if (apps.length === 0) return;

  const seen = await db.query.notification.findMany({
    where: and(
      eq(notification.userId, userId),
      inArray(notification.type, ["voting", "phase_unlocked"]),
    ),
    columns: { type: true, data: true },
  });

  const hasVotingNotification = (recruitmentId: number) =>
    seen.some(
      (n) => n.type === "voting" && dataRecruitmentId(n.data) === recruitmentId,
    );

  const hasPhaseUnlockNotification = (
    recruitmentId: number,
    identifier: string,
  ) =>
    seen.some(
      (n) =>
        n.type === "phase_unlocked" &&
        dataRecruitmentId(n.data) === recruitmentId &&
        normalizePhaseIdentifier(dataIdentifier(n.data)) ===
          normalizePhaseIdentifier(identifier),
    );

  const toCreate: Array<{
    userId: string;
    type: "voting" | "phase_unlocked";
    data: Record<string, unknown>;
  }> = [];

  for (const app of apps) {
    if (!hasVotingNotification(app.recruitmentId)) {
      const decision = await getLatestVotingDecisionForCandidate(
        userId,
        app.recruitmentId,
      );

      if (decision && (await canRevealCandidateResult(app.recruitmentId))) {
        toCreate.push({
          userId,
          type: "voting",
          data: {
            result: decision.decision === "reject" ? "rejected" : "accepted",
            recruitmentId: app.recruitmentId,
          },
        });
      }
    }

    const pendingUnlocks = UNLOCKABLE_PHASE_IDENTIFIERS.filter(
      (identifier) =>
        !hasPhaseUnlockNotification(app.recruitmentId, identifier),
    );

    if (pendingUnlocks.length > 0) {
      const phases = await getRecruitmentPhases("candidate", app.recruitmentId);

      for (const phase of phases) {
        const identifier = normalizePhaseIdentifier(phase.clientIdentifier);
        if (!pendingUnlocks.includes(identifier)) continue;
        if (getPhaseState(phase) !== "open") continue;

        toCreate.push({
          userId,
          type: "phase_unlocked",
          data: {
            phase: phase.title,
            identifier: phase.clientIdentifier,
            recruitmentId: app.recruitmentId,
          },
        });
      }
    }
  }

  if (toCreate.length > 0) {
    await db.insert(notification).values(toCreate);
  }
}
