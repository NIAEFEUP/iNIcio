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
import { and, desc, eq, gt, or } from "drizzle-orm";

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
    where: eq(recruitment.active, "true"),
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

export async function addRecruitment(r: Omit<Recruitment, "id"> | Recruitment) {
  const [created] = await db
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

  return created;
}

export async function editRecruitment(r: Recruitment) {
  await db
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
}

export async function deleteRecruitment(id: number) {
  await db.delete(recruitment).where(eq(recruitment.id, id));
}

export async function isRecruitmentActive() {
  const active = await getActiveRecruitment();
  return active !== null && active !== undefined;
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
          or(eq(slot.type, "interview-dynamic"), eq(slot.type, "interview")),
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
          or(eq(slot.type, "dynamic"), eq(slot.type, "interview-dynamic")),
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
          eq(recruitmentPhase.clientIdentifier, "entrevista"),
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
          eq(recruitmentPhase.clientIdentifier, "dinâmica"),
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
