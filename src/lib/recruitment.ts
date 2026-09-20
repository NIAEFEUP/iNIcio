import {
  recruitment,
  recruitmentPhase,
  recruitmentPhaseStatus,
  slot,
  recruiter,
  user,
  recruiterToCandidate,
  usersToRecruitments,
} from "@/db/schema";
import { db, Recruitment, RecruitmentPhase } from "./db";
import { and, desc, eq, gt, ne, sql } from "drizzle-orm";
import {
  getRecruitmentState,
  RECRUITMENT_PHASE_IDENTIFIERS,
  type RecruitmentState,
} from "./recruitment-state";

export async function getLatestRecruitment() {
  return await db.query.recruitment.findFirst({
    orderBy: (recruitment, { desc }) => [
      desc(recruitment.start),
      desc(recruitment.id),
    ],
  });
}

export async function getActiveRecruitment() {
  return await db.query.recruitment.findFirst({
    where: eq(recruitment.active, true),
    orderBy: (recruitment, { desc }) => [
      desc(recruitment.start),
      desc(recruitment.id),
    ],
  });
}

export async function getRecruitmentById(id: number) {
  return await db.query.recruitment.findFirst({
    where: eq(recruitment.id, id),
  });
}

export async function getRecruitments() {
  const recruitments = await db
    .select()
    .from(recruitment)
    .orderBy(desc(recruitment.start), desc(recruitment.id));

  return recruitments;
}

function assertRecruitmentWindow(r: Pick<Recruitment, "start" | "end">) {
  const start = new Date(r.start).getTime();
  const end = new Date(r.end).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw new Error("A data de fim tem de ser posterior à data de início");
  }
}

export async function addRecruitment(r: Omit<Recruitment, "id"> | Recruitment) {
  assertRecruitmentWindow(r);

  const [created] = await db.transaction(async (trx) => {
    if (r.active) {
      await trx.update(recruitment).set({ active: false });
    }

    return trx
      .insert(recruitment)
      .values({
        lectiveYear: r.lectiveYear,
        semester: r.semester,
        title: r.title,
        start: r.start,
        end: r.end,
        active: r.active,
      })
      .returning({ id: recruitment.id });
  });

  return created;
}

export async function editRecruitment(r: Recruitment) {
  assertRecruitmentWindow(r);

  await db.transaction(async (trx) => {
    // Lock and validate the target before touching other rows, so a stale id
    // cannot deactivate every recruitment while updating none of them.
    const [target] = await trx
      .select({ id: recruitment.id })
      .from(recruitment)
      .where(eq(recruitment.id, r.id))
      .for("update");

    if (!target) {
      throw new Error("Recrutamento não encontrado");
    }

    if (r.active) {
      await trx
        .update(recruitment)
        .set({ active: false })
        .where(ne(recruitment.id, r.id));
    }

    await trx
      .update(recruitment)
      .set({
        lectiveYear: r.lectiveYear,
        semester: r.semester,
        title: r.title,
        start: r.start,
        end: r.end,
        active: r.active,
      })
      .where(eq(recruitment.id, r.id));
  });
}

export async function deleteRecruitment(id: number) {
  await db.delete(recruitment).where(eq(recruitment.id, id));
}

export async function getAllRecruitmentPhases(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  const recruitmentPhases = await db
    .select()
    .from(recruitmentPhase)
    .where(eq(recruitmentPhase.recruitmentId, targetId));

  return recruitmentPhases;
}

/**
 * Copies the phases of the most recent other recruitment into the given one.
 * Returns the number of copied phases, or 0 when there is nothing to copy
 * (no other recruitment, previous one without phases, or the target already
 * has phases).
 */
export async function duplicatePhasesFromPreviousRecruitment(
  recruitmentId: number,
) {
  const recruitments = await getRecruitments();

  const target = recruitments.find((r) => r.id === recruitmentId);
  if (!target) return 0;

  const existing = await getAllRecruitmentPhases(recruitmentId);
  if (existing.length > 0) return 0;

  const otherRecruitments = recruitments.filter((r) => r.id !== recruitmentId);
  const targetStart = new Date(target.start).getTime();
  const chronologicalPrevious = otherRecruitments
    .filter((r) => new Date(r.start).getTime() <= targetStart)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  const source = chronologicalPrevious[0] ?? otherRecruitments[0];
  if (!source) return 0;

  const phases = await getAllRecruitmentPhases(source.id);
  if (phases.length === 0) return 0;

  await db.insert(recruitmentPhase).values(
    phases.map((phase) => ({
      recruitmentId,
      title: phase.title,
      description: phase.description,
      clientIdentifier: phase.clientIdentifier,
      start: phase.start,
      end: phase.end,
      role: phase.role,
    })),
  );

  return phases.length;
}

export async function getCurrentRecruitmentState(
  recruitmentId?: number,
): Promise<RecruitmentState> {
  const recruitment = recruitmentId
    ? await getRecruitmentById(recruitmentId)
    : await getActiveRecruitment();

  const phases = recruitment
    ? await getAllRecruitmentPhases(recruitment.id)
    : [];

  return getRecruitmentState(recruitment ?? null, phases);
}

export async function getRecruitmentPhases(
  role: "candidate" | "recruiter",
  recruitmentId?: number,
) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  const recruitmentPhases = await db
    .select()
    .from(recruitmentPhase)
    .where(
      and(
        eq(recruitmentPhase.recruitmentId, targetId),
        eq(recruitmentPhase.role, role),
      ),
    )
    .orderBy(recruitmentPhase.start);

  return recruitmentPhases;
}

export async function addRecruitmentPhase(r: RecruitmentPhase) {
  await db.insert(recruitmentPhase).values({
    recruitmentId: r.recruitmentId,
    title: r.title,
    description: r.description,
    clientIdentifier: r.clientIdentifier,
    start: r.start,
    end: r.end,
    role: r.role,
  });
}

export async function editRecruitmentPhase(r: RecruitmentPhase) {
  await db
    .update(recruitmentPhase)
    .set({
      recruitmentId: r.recruitmentId,
      title: r.title,
      description: r.description,
      start: r.start,
      clientIdentifier: r.clientIdentifier,
      end: r.end,
      role: r.role,
    })
    .where(eq(recruitmentPhase.id, r.id));
}

export async function deleteRecruitmentPhase(id: number) {
  await db.delete(recruitmentPhase).where(eq(recruitmentPhase.id, id));
}

export async function getInterviewSlots(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  return await db.transaction(async (trx) => {
    const interviewSlots = await trx
      .select()
      .from(slot)
      .where(
        and(
          eq(slot.type, "interview"),
          eq(slot.recruitmentId, targetId),
          gt(slot.quantity, 0),
        ),
      )
      .for("update");

    return interviewSlots;
  });
}

export async function getDynamicSlots(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  return await db.transaction(async (trx) => {
    const dynamicSlots = await trx
      .select()
      .from(slot)
      .where(
        and(
          eq(slot.type, "dynamic"),
          eq(slot.recruitmentId, targetId),
          gt(slot.quantity, 0),
        ),
      )
      .for("update");

    return dynamicSlots;
  });
}

export async function isRecruitmentPhaseDone(
  userId: string | undefined,
  phaseId: number,
) {
  if (!userId) return false;

  const phase = await db
    .select()
    .from(recruitmentPhaseStatus)
    .where(
      and(
        eq(recruitmentPhaseStatus.userId, userId),
        eq(recruitmentPhaseStatus.phaseId, phaseId),
        eq(recruitmentPhaseStatus.status, "done"),
      ),
    );

  return phase.length > 0;
}

export async function markInterviewRecruitmentPhaseAsDone(userId: string) {
  await db.transaction(async (tx) => {
    const phaseStatus = await tx
      .select({
        phaseId: recruitmentPhaseStatus.phaseId,
        status: recruitmentPhaseStatus.status,
        title: recruitmentPhase.title,
      })
      .from(recruitmentPhaseStatus)
      .innerJoin(
        recruitmentPhase,
        eq(recruitmentPhaseStatus.phaseId, recruitmentPhase.id),
      )
      .where(
        and(
          eq(recruitmentPhaseStatus.userId, userId),
          sql`lower(trim(${recruitmentPhase.clientIdentifier})) = ${RECRUITMENT_PHASE_IDENTIFIERS.interview}`,
        ),
      );

    if (phaseStatus.length > 0) {
      await tx
        .update(recruitmentPhaseStatus)
        .set({ status: "done" })
        .where(
          and(
            eq(recruitmentPhaseStatus.userId, userId),
            eq(recruitmentPhaseStatus.phaseId, phaseStatus[0].phaseId),
          ),
        );
    }
  });
}

export async function markDynamicRecruitmentPhaseAsDone(userId: string) {
  await db.transaction(async (tx) => {
    const phaseStatus = await tx
      .select({
        phaseId: recruitmentPhaseStatus.phaseId,
        status: recruitmentPhaseStatus.status,
        title: recruitmentPhase.title,
      })
      .from(recruitmentPhaseStatus)
      .innerJoin(
        recruitmentPhase,
        eq(recruitmentPhaseStatus.phaseId, recruitmentPhase.id),
      )
      .where(
        and(
          eq(recruitmentPhaseStatus.userId, userId),
          sql`lower(trim(${recruitmentPhase.clientIdentifier})) = ${RECRUITMENT_PHASE_IDENTIFIERS.dynamic}`,
        ),
      );

    if (phaseStatus.length > 0) {
      await tx
        .update(recruitmentPhaseStatus)
        .set({ status: "done" })
        .where(
          and(
            eq(recruitmentPhaseStatus.userId, userId),
            eq(recruitmentPhaseStatus.phaseId, phaseStatus[0].phaseId),
          ),
        );
    }
  });
}

export async function addRecruiter(userId: string, recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  await db.transaction(async (tx) => {
    await tx.insert(recruiter).values({ userId }).onConflictDoNothing();
    if (targetId) {
      await tx
        .insert(usersToRecruitments)
        .values({ userId, recruitmentId: targetId })
        .onConflictDoNothing();
    }
  });
}

export async function deleteRecruiter(userId: string, recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  await db.transaction(async (tx) => {
    if (targetId) {
      await tx
        .delete(usersToRecruitments)
        .where(
          and(
            eq(usersToRecruitments.userId, userId),
            eq(usersToRecruitments.recruitmentId, targetId),
          ),
        );
      await tx
        .delete(recruiterToCandidate)
        .where(
          and(
            eq(recruiterToCandidate.recruiterId, userId),
            eq(recruiterToCandidate.recruitmentId, targetId),
          ),
        );

      const remaining = await tx
        .select()
        .from(usersToRecruitments)
        .where(eq(usersToRecruitments.userId, userId));

      if (remaining.length === 0) {
        await tx.delete(recruiter).where(eq(recruiter.userId, userId));
      }
    } else {
      await tx
        .delete(recruiterToCandidate)
        .where(eq(recruiterToCandidate.recruiterId, userId));

      await tx
        .delete(usersToRecruitments)
        .where(eq(usersToRecruitments.userId, userId));

      await tx.delete(recruiter).where(eq(recruiter.userId, userId));
    }
  });
}

export async function addRecruiterToRecruitment(
  userId: string,
  recruitmentId: number,
) {
  await db
    .insert(usersToRecruitments)
    .values({ userId, recruitmentId })
    .onConflictDoNothing();
}

export async function removeRecruiterFromRecruitment(
  userId: string,
  recruitmentId: number,
) {
  await db
    .delete(usersToRecruitments)
    .where(
      and(
        eq(usersToRecruitments.userId, userId),
        eq(usersToRecruitments.recruitmentId, recruitmentId),
      ),
    );
}

export async function getRecruiters(recruitmentId?: number) {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  return await db
    .select({
      userId: usersToRecruitments.userId,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(usersToRecruitments)
    .innerJoin(user, eq(user.id, usersToRecruitments.userId))
    .where(eq(usersToRecruitments.recruitmentId, targetId));
}

export async function getAllPlatformRecruiters() {
  return await db
    .select({
      userId: recruiter.userId,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(recruiter)
    .leftJoin(user, eq(user.id, recruiter.userId));
}

export async function getUsers(limit = 500) {
  const res = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(user)
    .limit(limit);

  return res;
}
