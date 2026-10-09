import { and, eq, gte, notExists } from "drizzle-orm";
import { candidate, user, usersToRecruitments } from "@/db/schema";
import { db } from "@/lib/db";
import type { EmailTemplateType } from "@/lib/email-composer";

export interface EmailRecipient {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: "recruiter" | "candidate" | "admin";
  /** ISO date, so the payload stays serialisable across the RSC boundary. */
  accountCreatedAt: string;
  /** `true` when the user is a candidate of the current recruitment. */
  isCandidate: boolean;
  /** Candidates of this recruitment that are still missing a booking. */
  missingInterview: boolean;
  missingDynamic: boolean;
}

export interface EmailRecipientsPayload {
  recipients: EmailRecipient[];
  /** Recipient ids each quick-send audience resolves to. */
  audiences: Record<EmailTemplateType, string[]>;
}

/** Jan 1st of the current calendar year, in UTC. */
function startOfCurrentYear(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
}

/**
 * Every account a recruiter may email about this recruitment, plus the
 * recipient ids behind each quick-send audience.
 *
 * `excludeUserId` drops the sender from the list so nobody emails themselves.
 */
export async function getEmailRecipients({
  recruitmentId,
  excludeUserId,
  now = new Date(),
}: {
  recruitmentId: number;
  excludeUserId?: string;
  now?: Date;
}): Promise<EmailRecipientsPayload> {
  const candidates = await db.query.candidate.findMany({
    where: eq(candidate.recruitmentId, recruitmentId),
    with: {
      user: true,
      interview: { columns: { id: true } },
      dynamic: { columns: { dynamicId: true } },
    },
  });

  const candidateRecipients: EmailRecipient[] = candidates.map((row) => ({
    id: row.user.id,
    name: row.user.name,
    email: row.user.email,
    image: row.user.image,
    role: row.user.role,
    accountCreatedAt: row.user.createdAt.toISOString(),
    isCandidate: true,
    missingInterview: !row.interview,
    missingDynamic: !row.dynamic,
  }));

  // Candidate accounts created this year that never became candidates of this
  // recruitment — the "you still haven't applied" audience.
  const nonCandidates = await db
    .select()
    .from(user)
    .where(
      and(
        eq(user.role, "candidate"),
        gte(user.createdAt, startOfCurrentYear(now)),
        notExists(
          db
            .select({ userId: candidate.userId })
            .from(candidate)
            .where(
              and(
                eq(candidate.userId, user.id),
                eq(candidate.recruitmentId, recruitmentId),
              ),
            ),
        ),
      ),
    )
    .orderBy(user.name);

  const nonCandidateRecipients: EmailRecipient[] = nonCandidates.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    role: row.role,
    accountCreatedAt: row.createdAt.toISOString(),
    isCandidate: false,
    missingInterview: false,
    missingDynamic: false,
  }));

  // Get recruiters for this recruitment to exclude them
  const recruitmentRecruiters = await db.query.usersToRecruitments.findMany({
    where: eq(usersToRecruitments.recruitmentId, recruitmentId),
    columns: {
      userId: true,
    },
  });
  const recruiterIds = new Set(recruitmentRecruiters.map((r) => r.userId));

  const recipients = [...candidateRecipients, ...nonCandidateRecipients].filter(
    (recipient) =>
      recipient.id !== excludeUserId &&
      Boolean(recipient.email) &&
      !recruiterIds.has(recipient.id),
  );

  const candidatesFor = (predicate: (recipient: EmailRecipient) => boolean) =>
    candidateRecipients.filter(predicate).map((recipient) => recipient.id);

  const audiences: Record<EmailTemplateType, string[]> = {
    all: candidatesFor((recipient) => !recruiterIds.has(recipient.id)),
    not_applied: nonCandidateRecipients
      .filter(
        (recipient) =>
          recipient.id !== excludeUserId && !recruiterIds.has(recipient.id),
      )
      .map((recipient) => recipient.id),
    no_interview: candidatesFor(
      (recipient) =>
        recipient.missingInterview && !recruiterIds.has(recipient.id),
    ),
    no_dynamic: candidatesFor(
      (recipient) =>
        recipient.missingDynamic && !recruiterIds.has(recipient.id),
    ),
    no_scheduling: candidatesFor(
      (recipient) =>
        (recipient.missingInterview || recipient.missingDynamic) &&
        !recruiterIds.has(recipient.id),
    ),
  };

  return { recipients, audiences };
}
