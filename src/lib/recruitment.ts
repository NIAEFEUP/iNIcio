import {
  recruitment,
  recruitmentPhase,
  recruitmentPhaseStatus,
  slot,
  recruiter,
  user,
  recruiterToCandidate,
} from "@/db/schema";
import { db, Recruitment, RecruitmentPhase } from "./db";
import { and, eq, gt, or } from "drizzle-orm";

export async function getLatestRecruitment() {
  return await db.query.recruitment.findFirst({
    orderBy: (recruitment, { desc }) => [desc(recruitment.year)],
  });
}

export async function getRecruitments() {
  const recruitments = await db.select().from(recruitment);

  return recruitments;
}

export async function addRecruitment(r: Recruitment) {
  await db.insert(recruitment).values({
    year: r.year,
    start: r.start,
    end: r.end,
    active: r.active,
  });
}

export async function editRecruitment(r: Recruitment) {
  await db
    .update(recruitment)
    .set({
      year: r.year,
      start: r.start,
      end: r.end,
      active: r.active,
    })
    .where(eq(recruitment.year, r.year));
}

export async function deleteRecruitment(year: number) {
  await db.delete(recruitment).where(eq(recruitment.year, year));
}

export async function isRecruitmentActive() {
  const currentYear = new Date().getFullYear();

  const currentRecrutment = await db
    .select()
    .from(recruitment)
    .where(
      and(eq(recruitment.year, currentYear), eq(recruitment.active, "true")),
    );

  return currentRecrutment.length > 0;
}

export async function getAllRecruitmentPhases() {
  const currentYear = new Date().getFullYear();

  const recruitmentPhases = await db
    .select()
    .from(recruitmentPhase)
    .where(eq(recruitmentPhase.recruitmentYear, currentYear));

  return recruitmentPhases;
}

export async function getRecruitmentPhases(role: "candidate" | "recruiter") {
  const currentYear = new Date().getFullYear();

  const recruitmentPhases = await db
    .select()
    .from(recruitmentPhase)
    .where(
      and(
        eq(recruitmentPhase.recruitmentYear, currentYear),
        eq(recruitmentPhase.role, role),
      ),
    )
    .orderBy(recruitmentPhase.start);

  return recruitmentPhases;
}

export async function addRecruitmentPhase(r: RecruitmentPhase) {
  await db.insert(recruitmentPhase).values({
    recruitmentYear: r.recruitmentYear,
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
      recruitmentYear: r.recruitmentYear,
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

export async function getInterviewSlots() {
  const currentYear = new Date().getFullYear();

  return await db.transaction(async (trx) => {
    const interviewSlots = await trx
      .select()
      .from(slot)
      .where(
        and(
          or(
            and(
              eq(slot.type, "interview-dynamic"),
              eq(slot.recruitmentYear, currentYear),
            ),
            and(
              eq(slot.type, "interview"),
              eq(slot.recruitmentYear, currentYear),
            ),
          ),
          gt(slot.quantity, 0),
        ),
      )
      .for("update");

    return interviewSlots;
  });
}

export async function getDynamicSlots() {
  const currentYear = new Date().getFullYear();

  return await db.transaction(async (trx) => {
    const dynamicSlots = await trx
      .select()
      .from(slot)
      .where(
        and(
          or(
            and(
              eq(slot.type, "dynamic"),
              eq(slot.recruitmentYear, currentYear),
            ),
            and(
              eq(slot.type, "interview-dynamic"),
              eq(slot.recruitmentYear, currentYear),
            ),
          ),
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
  const phaseStatus = await db
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
        eq(recruitmentPhase.title, "Entrevista"),
      ),
    );

  await db
    .update(recruitmentPhaseStatus)
    .set({ status: "done" })
    .where(eq(recruitmentPhaseStatus.phaseId, phaseStatus[0].phaseId));
}

export async function markDynamicRecruitmentPhaseAsDone(userId: string) {
  const phaseStatus = await db
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
        eq(recruitmentPhase.title, "Dinâmica"),
      ),
    );

  await db
    .update(recruitmentPhaseStatus)
    .set({ status: "done" })
    .where(eq(recruitmentPhaseStatus.phaseId, phaseStatus[0].phaseId));
}

export async function addRecruiter(userId: string) {
  await db.insert(recruiter).values({ userId });
}

export async function deleteRecruiter(userId: string) {
  await db.transaction(async (tx) => {
    await tx
      .delete(recruiterToCandidate)
      .where(eq(recruiterToCandidate.recruiterId, userId));

    await tx.delete(recruiter).where(eq(recruiter.userId, userId));
  });
}

export async function getRecruiters() {
  const res = await db
    .select({ userId: recruiter.userId, name: user.name, email: user.email })
    .from(recruiter)
    .leftJoin(user, eq(user.id, recruiter.userId));

  return res;
}

export async function getUsers(limit = 500) {
  const res = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .limit(limit);

  return res;
}
