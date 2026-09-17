import { db } from "@/lib/db";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import {
  user,
  candidate,
  recruiterToCandidate,
  recruiter,
  account,
  application,
  applicationInterests,
  recruitmentPhase,
  recruitment,
  slot,
  interview,
  dynamic,
  candidateToDynamic,
  recruiterToDynamic,
  recruiterToInterview,
  recruitmentPhaseStatus,
  admin,
  usersToRecruitments,
  votingPhase,
  votingPhaseCandidate,
  candidateVote,
  recruiterVote,
  votingPhaseStatus,
  interviewComment,
  dynamicComment,
  applicationComment,
  appreciation,
  tag,
  applicationToTag,
  notification,
  recruiterAvailability,
  finalMessageTemplate,
} from "./schema";

type PhaseStatus = "blocked" | "todo" | "done";
type PhaseMap = Record<string, number>;

const PASSWORD = "testeteste";

/**
 * Seed fixture covering every meaningful account/data state.
 *
 * CANDIDATES
 *  1  candidato1@test.com  Re-applicant. Past: accepted. Current: applied, interview
 *                          + dynamic booked, voting still open -> result pending.
 *  2  candidato2@test.com  Past only, accepted. No current application.
 *  5  candidato3@test.com  Registered, never applied (can still apply).
 *  6  candidato4@test.com  Current: applied, nothing scheduled yet.
 *  7  candidato5@test.com  Current: applied + interview booked, dynamic pending.
 *  8  candidato6@test.com  Current: fully processed, voting finished -> ACCEPTED.
 *  9  candidato7@test.com  Current: fully processed, voting finished -> REJECTED.
 * 10  candidato8@test.com  Past only, rejected history. No current application.
 *
 * RECRUITERS
 *  3  recrutador@test.com  Enrolled past + current, availability set, assigned to
 *                          interviews/dynamics, has voted.
 * 11  recrutador2@test.com Enrolled current only, no availability, no assignments.
 * 12  recrutador3@test.com Enrolled current only, availability set, no assignments.
 *
 * ADMIN
 *  4  admin@test.com       Platform admin (also has recruiter privileges).
 */
async function main() {
  const pastLectiveYear = "2025/2026";
  const currentLectiveYear = "2026/2027";
  const now = new Date();

  // ── Clear all tables (dependency order) ──────────────────────────
  await db.delete(notification);
  await db.delete(applicationComment);
  await db.delete(dynamicComment);
  await db.delete(interviewComment);
  await db.delete(appreciation);
  await db.delete(applicationToTag);
  await db.delete(applicationInterests);
  await db.delete(application);
  await db.delete(tag);
  await db.delete(candidateVote);
  await db.delete(recruiterVote);
  await db.delete(votingPhaseCandidate);
  await db.delete(votingPhaseStatus);
  await db.delete(votingPhase);
  await db.delete(finalMessageTemplate);
  await db.delete(recruiterToDynamic);
  await db.delete(candidateToDynamic);
  await db.delete(dynamic);
  await db.delete(recruiterToInterview);
  await db.delete(interview);
  await db.delete(recruiterToCandidate);
  await db.delete(recruiterAvailability);
  await db.delete(slot);
  await db.delete(recruitmentPhaseStatus);
  await db.delete(recruitmentPhase);
  await db.delete(usersToRecruitments);
  await db.delete(recruiter);
  await db.delete(candidate);
  await db.delete(admin);
  await db.delete(account);
  await db.delete(user);
  await db.delete(recruitment);

  // ── Helpers ──────────────────────────────────────────────────────
  async function seedUser(
    id: string,
    name: string,
    email: string,
    role: "candidate" | "recruiter" | "admin",
  ) {
    await db.insert(user).values({
      id,
      name,
      email,
      emailVerified: true,
      role,
      createdAt: now,
      updatedAt: now,
    });
  }

  async function seedPhases(
    recruitmentId: number,
    dates: Record<string, [string, string]>,
  ): Promise<PhaseMap> {
    const defs: Array<{
      key: string;
      role: "candidate" | "recruiter";
      title: string;
      clientIdentifier: string;
      description: string;
    }> = [
      {
        key: "candidatura",
        role: "candidate",
        title: "Candidatura",
        clientIdentifier: "candidatura",
        description: "Submete a tua candidatura",
      },
      {
        key: "avaliacao",
        role: "recruiter",
        title: "Avaliação de Candidaturas",
        clientIdentifier: "avaliacao",
        description: "Avalia as candidaturas recebidas",
      },
      {
        key: "entrevista",
        role: "candidate",
        title: "Entrevista",
        clientIdentifier: "entrevista",
        description: "Marca a tua entrevista",
      },
      {
        key: "dinamica",
        role: "candidate",
        title: "Dinâmica",
        clientIdentifier: "dinâmica",
        description: "Participa na dinâmica de grupo",
      },
      {
        key: "votacao",
        role: "recruiter",
        title: "Votação",
        clientIdentifier: "votacao",
        description: "Vota sobre os candidatos",
      },
    ];

    const ids: PhaseMap = {};
    for (const def of defs) {
      const [row] = await db
        .insert(recruitmentPhase)
        .values({
          recruitmentId,
          role: def.role,
          title: def.title,
          clientIdentifier: def.clientIdentifier,
          description: def.description,
          start: new Date(dates[def.key][0]),
          end: new Date(dates[def.key][1]),
        })
        .returning({ id: recruitmentPhase.id });
      ids[def.key] = row.id;
    }
    return ids;
  }

  async function seedCandidatePhaseStatuses(
    userId: string,
    phases: PhaseMap,
    statuses: {
      candidatura: PhaseStatus;
      entrevista: PhaseStatus;
      dinamica: PhaseStatus;
    },
  ) {
    await db.insert(recruitmentPhaseStatus).values({
      userId,
      phaseId: phases.candidatura,
      status: statuses.candidatura,
    });
    await db.insert(recruitmentPhaseStatus).values({
      userId,
      phaseId: phases.entrevista,
      status: statuses.entrevista,
    });
    await db.insert(recruitmentPhaseStatus).values({
      userId,
      phaseId: phases.dinamica,
      status: statuses.dinamica,
    });
  }

  async function seedRecruiterPhaseStatuses(
    userId: string,
    phases: PhaseMap,
    statuses: { avaliacao: PhaseStatus; votacao: PhaseStatus },
  ) {
    await db.insert(recruitmentPhaseStatus).values({
      userId,
      phaseId: phases.avaliacao,
      status: statuses.avaliacao,
    });
    await db.insert(recruitmentPhaseStatus).values({
      userId,
      phaseId: phases.votacao,
      status: statuses.votacao,
    });
  }

  async function seedApplication(params: {
    candidateId: string;
    recruitmentId: number;
    studentNumber: number;
    degree: string;
    curricularYear: string;
    phone?: string;
    linkedIn?: string;
    github?: string;
    experience?: string;
    motivation?: string;
    selfPromotion?: string;
    interestJustification?: string;
    suggestions?: string;
    accepted?: boolean;
    interests?: string[];
    tagIds?: number[];
  }) {
    const [app] = await db
      .insert(application)
      .values({
        candidateId: params.candidateId,
        recruitmentId: params.recruitmentId,
        studentNumber: params.studentNumber,
        linkedIn: params.linkedIn,
        github: params.github,
        phone: params.phone,
        degree: params.degree,
        curricularYear: params.curricularYear,
        experience: params.experience,
        motivation: params.motivation,
        selfPromotion: params.selfPromotion,
        interestJustification: params.interestJustification,
        suggestions: params.suggestions,
        accepted: params.accepted ?? false,
      })
      .returning({ id: application.id });

    for (const interest of params.interests ?? []) {
      await db
        .insert(applicationInterests)
        .values({ applicationId: app.id, interest });
    }
    for (const tagId of params.tagIds ?? []) {
      await db
        .insert(applicationToTag)
        .values({ applicationId: app.id, tagId });
    }
    return app.id;
  }

  async function seedSlot(
    recruitmentId: number,
    start: string,
    duration: number,
    type: "interview" | "dynamic" | "interview-dynamic",
    quantity = 1,
  ) {
    const [row] = await db
      .insert(slot)
      .values({
        recruitmentId,
        start: new Date(start),
        duration,
        type,
        quantity,
      })
      .returning({ id: slot.id });
    return row.id;
  }

  async function seedInterview(params: {
    recruitmentId: number;
    candidateId: string;
    slotId: number;
    content: string;
    locked: boolean;
    recruiterIds: string[];
  }) {
    const [row] = await db
      .insert(interview)
      .values({
        recruitmentId: params.recruitmentId,
        candidateId: params.candidateId,
        slot: params.slotId,
        content: [{ type: "paragraph", content: params.content }],
        locked: params.locked,
      })
      .returning({ id: interview.id });
    for (const recruiterId of params.recruiterIds) {
      await db
        .insert(recruiterToInterview)
        .values({ recruiterId, interviewId: row.id });
    }
    return row.id;
  }

  async function seedDynamic(params: {
    recruitmentId: number;
    slotId: number;
    content: string;
    candidateIds: string[];
    recruiterIds: string[];
  }) {
    const [row] = await db
      .insert(dynamic)
      .values({
        recruitmentId: params.recruitmentId,
        slot: params.slotId,
        content: [{ type: "paragraph", content: params.content }],
      })
      .returning({ id: dynamic.id });
    for (const candidateId of params.candidateIds) {
      await db.insert(candidateToDynamic).values({
        candidateId,
        dynamicId: row.id,
        recruitmentId: params.recruitmentId,
      });
    }
    for (const recruiterId of params.recruiterIds) {
      await db
        .insert(recruiterToDynamic)
        .values({ recruiterId, dynamicId: row.id });
    }
    return row.id;
  }

  async function seedVotingPhase(
    recruitmentId: number,
    entries: Array<{
      candidateId: string;
      voteFinished: boolean;
      vote?: "approve" | "reject";
      accepted?: number;
      rejected?: number;
    }>,
    recruiterIds: string[],
    createdAt?: Date,
  ) {
    const [vp] = await db
      .insert(votingPhase)
      .values({ recruitmentId, created_at: createdAt })
      .returning({ id: votingPhase.id });

    for (const entry of entries) {
      await db.insert(votingPhaseCandidate).values({
        votingPhaseId: vp.id,
        candidateId: entry.candidateId,
        recruitmentId,
        voteFinished: entry.voteFinished,
      });
      await db.insert(votingPhaseStatus).values({
        votingPhaseId: vp.id,
        candidateId: entry.candidateId,
        accepted_candidates: entry.accepted ?? 0,
        rejected_candidates: entry.rejected ?? 0,
      });

      if (entry.vote) {
        await db.insert(candidateVote).values({
          votingPhaseId: vp.id,
          candidateId: entry.candidateId,
          decision: entry.vote,
        });
        for (const recruiterId of recruiterIds) {
          await db.insert(recruiterVote).values({
            votingPhaseId: vp.id,
            recruiterId,
            candidateId: entry.candidateId,
          });
        }
      }
    }
    return vp.id;
  }

  // ── Users + credentials ──────────────────────────────────────────
  await seedUser("1", "Candidato 1", "candidato1@test.com", "candidate");
  await seedUser("2", "Candidato 2", "candidato2@test.com", "candidate");
  await seedUser("3", "Recrutador 1", "recrutador@test.com", "recruiter");
  await seedUser("4", "Admin", "admin@test.com", "admin");
  await seedUser("5", "Candidato 3", "candidato3@test.com", "candidate");
  await seedUser("6", "Candidato 4", "candidato4@test.com", "candidate");
  await seedUser("7", "Candidato 5", "candidato5@test.com", "candidate");
  await seedUser("8", "Candidato 6", "candidato6@test.com", "candidate");
  await seedUser("9", "Candidato 7", "candidato7@test.com", "candidate");
  await seedUser("10", "Candidato 8", "candidato8@test.com", "candidate");
  await seedUser("11", "Recrutador 2", "recrutador2@test.com", "recruiter");
  await seedUser("12", "Recrutador 3", "recrutador3@test.com", "recruiter");

  // ── Platform roles ───────────────────────────────────────────────
  await db.insert(recruiter).values({ userId: "3" });
  await db.insert(recruiter).values({ userId: "11" });
  await db.insert(recruiter).values({ userId: "12" });
  await db.insert(admin).values({ userId: "4" });

  const hashed = await hashPassword(PASSWORD);
  for (const id of [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ]) {
    await db.insert(account).values({
      id,
      accountId: id,
      providerId: "credential",
      issuer: "local:credential",
      userId: id,
      password: hashed,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ════════════════════════════════════════════════════════════════
  // PAST RECRUITMENT (2025/2026, inactive, completed)
  // ════════════════════════════════════════════════════════════════
  const [pastRecruitment] = await db
    .insert(recruitment)
    .values({
      lectiveYear: pastLectiveYear,
      semester: 1,
      title: `Recrutamento ${pastLectiveYear} - 1º Semestre`,
      active: "false",
      start: new Date("2025-09-01T00:00:00.000Z"),
      end: new Date("2025-10-01T00:00:00.000Z"),
    })
    .returning({ id: recruitment.id });

  await db.insert(usersToRecruitments).values({
    userId: "3",
    recruitmentId: pastRecruitment.id,
  });

  const pastPhases = await seedPhases(pastRecruitment.id, {
    candidatura: ["2025-09-01T00:00:00.000Z", "2025-09-15T00:00:00.000Z"],
    avaliacao: ["2025-09-01T00:00:00.000Z", "2025-09-15T00:00:00.000Z"],
    entrevista: ["2025-09-15T00:00:00.000Z", "2025-09-30T00:00:00.000Z"],
    dinamica: ["2025-09-15T00:00:00.000Z", "2025-09-30T00:00:00.000Z"],
    votacao: ["2025-09-25T00:00:00.000Z", "2025-10-01T00:00:00.000Z"],
  });

  // Past candidates: 1 & 2 accepted, 10 rejected
  for (const candidateId of ["1", "2", "10"]) {
    await db
      .insert(candidate)
      .values({ userId: candidateId, recruitmentId: pastRecruitment.id });
    await db.insert(recruiterToCandidate).values({
      recruiterId: "3",
      candidateId,
      recruitmentId: pastRecruitment.id,
    });
  }

  for (const candidateId of ["1", "2", "10"]) {
    await seedCandidatePhaseStatuses(candidateId, pastPhases, {
      candidatura: "done",
      entrevista: "done",
      dinamica: "done",
    });
  }
  await seedRecruiterPhaseStatuses("3", pastPhases, {
    avaliacao: "done",
    votacao: "done",
  });

  const pastInterviewSlot1 = await seedSlot(
    pastRecruitment.id,
    "2025-09-20T10:00:00.000Z",
    30,
    "interview",
  );
  const pastInterviewSlot2 = await seedSlot(
    pastRecruitment.id,
    "2025-09-21T10:00:00.000Z",
    45,
    "interview-dynamic",
  );
  const pastInterviewSlot3 = await seedSlot(
    pastRecruitment.id,
    "2025-09-22T10:00:00.000Z",
    30,
    "interview",
  );
  const pastDynamicSlot = await seedSlot(
    pastRecruitment.id,
    "2025-09-20T14:00:00.000Z",
    60,
    "dynamic",
  );

  const pastApp1 = await seedApplication({
    candidateId: "1",
    recruitmentId: pastRecruitment.id,
    studentNumber: 202100001,
    linkedIn: "https://linkedin.com/in/candidato1",
    github: "https://github.com/candidato1",
    phone: "910000001",
    degree: "meic",
    curricularYear: "3bsc",
    experience: "2 anos de desenvolvimento web",
    motivation: "Quero fazer parte do NIAEFEUP",
    selfPromotion: "Gosto de projetos open source",
    interestJustification: "O NIAEFEUP alinha com os meus interesses",
    suggestions: "Nenhuma",
    accepted: true,
    interests: ["projetos", "website"],
  });

  const pastApp2 = await seedApplication({
    candidateId: "2",
    recruitmentId: pastRecruitment.id,
    studentNumber: 202100002,
    linkedIn: "https://linkedin.com/in/candidato2",
    github: "https://github.com/candidato2",
    phone: "910000002",
    degree: "leic",
    curricularYear: "2bsc",
    experience: "1 ano de desenvolvimento mobile",
    motivation: "Quero aprender mais",
    selfPromotion: "Dedicado e proativo",
    interestJustification: "Interesse em tecnologia",
    suggestions: "Mais eventos",
    accepted: true,
    interests: ["comunicacao"],
  });

  await seedApplication({
    candidateId: "10",
    recruitmentId: pastRecruitment.id,
    studentNumber: 202100008,
    degree: "leic",
    curricularYear: "1bsc",
    phone: "910000008",
    experience: "Primeira experiência",
    motivation: "Quero experimentar",
    selfPromotion: "Vontade de aprender",
    interestJustification: "Curiosidade",
    accepted: false,
    interests: ["projetos"],
  });

  const [tagWeb] = await db
    .insert(tag)
    .values({ name: "web" })
    .returning({ id: tag.id });
  const [tagMobile] = await db
    .insert(tag)
    .values({ name: "mobile" })
    .returning({ id: tag.id });
  await db
    .insert(applicationToTag)
    .values({ applicationId: pastApp1, tagId: tagWeb.id });
  await db
    .insert(applicationToTag)
    .values({ applicationId: pastApp2, tagId: tagMobile.id });

  await db.insert(appreciation).values([
    { applicationId: pastApp1, recruiterId: "3", grade: 3 },
    { applicationId: pastApp2, recruiterId: "3", grade: 2 },
  ]);

  await db.insert(applicationComment).values({
    applicationId: pastApp1,
    authorId: "3",
    content: [{ type: "paragraph", content: "Candidato forte" }],
  });

  const pastInterview1 = await seedInterview({
    recruitmentId: pastRecruitment.id,
    candidateId: "1",
    slotId: pastInterviewSlot1,
    content: "Entrevista passada - Candidato 1",
    locked: true,
    recruiterIds: ["3"],
  });
  await seedInterview({
    recruitmentId: pastRecruitment.id,
    candidateId: "2",
    slotId: pastInterviewSlot2,
    content: "Entrevista passada - Candidato 2",
    locked: true,
    recruiterIds: ["3"],
  });
  await seedInterview({
    recruitmentId: pastRecruitment.id,
    candidateId: "10",
    slotId: pastInterviewSlot3,
    content: "Entrevista passada - Candidato 8",
    locked: true,
    recruiterIds: ["3"],
  });

  await db.insert(interviewComment).values({
    interviewId: pastInterview1,
    authorId: "3",
    content: [{ type: "paragraph", content: "Excelente prestação" }],
  });

  const pastDynamic = await seedDynamic({
    recruitmentId: pastRecruitment.id,
    slotId: pastDynamicSlot,
    content: "Dinâmica passada",
    candidateIds: ["1", "2", "10"],
    recruiterIds: ["3"],
  });
  await db.insert(dynamicComment).values({
    dynamicId: pastDynamic,
    authorId: "3",
    content: [{ type: "paragraph", content: "Bom trabalho em equipa" }],
  });

  await seedVotingPhase(
    pastRecruitment.id,
    [
      {
        candidateId: "1",
        voteFinished: true,
        vote: "approve",
        accepted: 3,
        rejected: 0,
      },
      {
        candidateId: "2",
        voteFinished: true,
        vote: "approve",
        accepted: 2,
        rejected: 1,
      },
      {
        candidateId: "10",
        voteFinished: true,
        vote: "reject",
        accepted: 0,
        rejected: 3,
      },
    ],
    ["3"],
    new Date("2025-09-28T12:00:00.000Z"),
  );

  await db
    .update(candidate)
    .set({
      interviewClassification: "muito forte",
      dynamicClassification: "normal",
    })
    .where(
      and(
        eq(candidate.userId, "1"),
        eq(candidate.recruitmentId, pastRecruitment.id),
      ),
    );
  await db
    .update(candidate)
    .set({
      interviewClassification: "normal",
      dynamicClassification: "muito forte",
    })
    .where(
      and(
        eq(candidate.userId, "2"),
        eq(candidate.recruitmentId, pastRecruitment.id),
      ),
    );
  await db
    .update(candidate)
    .set({
      interviewClassification: "muito fraco",
      dynamicClassification: "muito fraco",
    })
    .where(
      and(
        eq(candidate.userId, "10"),
        eq(candidate.recruitmentId, pastRecruitment.id),
      ),
    );

  // ════════════════════════════════════════════════════════════════
  // CURRENT RECRUITMENT (2026/2027, active)
  // ════════════════════════════════════════════════════════════════
  const [currentRecruitment] = await db
    .insert(recruitment)
    .values({
      lectiveYear: currentLectiveYear,
      semester: 1,
      title: `Recrutamento ${currentLectiveYear} - 1º Semestre`,
      active: "true",
      start: new Date("2026-09-01T00:00:00.000Z"),
      end: new Date("2026-09-30T16:00:00.000Z"),
    })
    .returning({ id: recruitment.id });

  for (const recruiterId of ["3", "11", "12"]) {
    await db.insert(usersToRecruitments).values({
      userId: recruiterId,
      recruitmentId: currentRecruitment.id,
    });
  }

  const currentPhases = await seedPhases(currentRecruitment.id, {
    candidatura: ["2026-09-01T00:00:00.000Z", "2026-09-10T00:00:00.000Z"],
    avaliacao: ["2026-09-01T00:00:00.000Z", "2026-09-10T00:00:00.000Z"],
    entrevista: ["2026-09-10T00:00:00.000Z", "2026-09-20T00:00:00.000Z"],
    dinamica: ["2026-09-10T00:00:00.000Z", "2026-09-20T00:00:00.000Z"],
    votacao: ["2026-09-20T00:00:00.000Z", "2026-09-30T00:00:00.000Z"],
  });

  // Current candidates:
  //  1 = re-applicant, mid-process (interview + dynamic booked, voting open)
  //  6 = applied only (nothing scheduled)
  //  7 = applied + interview booked (dynamic pending)
  //  8 = fully processed, accepted
  //  9 = fully processed, rejected
  const currentCandidateIds = ["1", "6", "7", "8", "9"];
  for (const candidateId of currentCandidateIds) {
    await db.insert(candidate).values({
      userId: candidateId,
      recruitmentId: currentRecruitment.id,
    });
    await db.insert(recruiterToCandidate).values({
      recruiterId: "3",
      candidateId,
      recruitmentId: currentRecruitment.id,
    });
  }

  await seedCandidatePhaseStatuses("1", currentPhases, {
    candidatura: "done",
    entrevista: "done",
    dinamica: "done",
  });
  await seedCandidatePhaseStatuses("6", currentPhases, {
    candidatura: "done",
    entrevista: "todo",
    dinamica: "todo",
  });
  await seedCandidatePhaseStatuses("7", currentPhases, {
    candidatura: "done",
    entrevista: "done",
    dinamica: "todo",
  });
  await seedCandidatePhaseStatuses("8", currentPhases, {
    candidatura: "done",
    entrevista: "done",
    dinamica: "done",
  });
  await seedCandidatePhaseStatuses("9", currentPhases, {
    candidatura: "done",
    entrevista: "done",
    dinamica: "done",
  });

  await seedRecruiterPhaseStatuses("3", currentPhases, {
    avaliacao: "done",
    votacao: "todo",
  });
  await seedRecruiterPhaseStatuses("11", currentPhases, {
    avaliacao: "todo",
    votacao: "blocked",
  });
  await seedRecruiterPhaseStatuses("12", currentPhases, {
    avaliacao: "todo",
    votacao: "todo",
  });

  // Current slots
  const slotInterview1 = await seedSlot(
    currentRecruitment.id,
    "2026-09-15T10:00:00.000Z",
    30,
    "interview",
  );
  await seedSlot(
    currentRecruitment.id,
    "2026-09-15T11:00:00.000Z",
    30,
    "interview",
  );
  const slotInterview5 = await seedSlot(
    currentRecruitment.id,
    "2026-09-15T12:00:00.000Z",
    30,
    "interview",
  );
  const slotInterview6 = await seedSlot(
    currentRecruitment.id,
    "2026-09-16T10:00:00.000Z",
    30,
    "interview",
  );
  const slotInterview7 = await seedSlot(
    currentRecruitment.id,
    "2026-09-16T11:00:00.000Z",
    30,
    "interview",
  );
  await seedSlot(
    currentRecruitment.id,
    "2026-09-17T10:00:00.000Z",
    45,
    "interview-dynamic",
  );
  const slotDynamic1 = await seedSlot(
    currentRecruitment.id,
    "2026-09-16T14:00:00.000Z",
    60,
    "dynamic",
  );
  const slotDynamic2 = await seedSlot(
    currentRecruitment.id,
    "2026-09-17T14:00:00.000Z",
    60,
    "dynamic",
  );

  // Current applications
  await seedApplication({
    candidateId: "1",
    recruitmentId: currentRecruitment.id,
    studentNumber: 202100001,
    linkedIn: "https://linkedin.com/in/candidato1",
    github: "https://github.com/candidato1",
    phone: "910000001",
    degree: "meic",
    curricularYear: "2msc",
    experience: "3 anos de desenvolvimento web",
    motivation: "Re-candidatura para continuar a contribuir para o NIAEFEUP",
    selfPromotion: "Gosto de projetos open source e mentoria",
    interestJustification: "O NIAEFEUP alinha com os meus interesses",
    suggestions: "Nenhuma",
    accepted: false,
    interests: ["projetos", "website"],
    tagIds: [tagWeb.id],
  });

  await seedApplication({
    candidateId: "6",
    recruitmentId: currentRecruitment.id,
    studentNumber: 202100004,
    phone: "910000004",
    degree: "leic",
    curricularYear: "1bsc",
    experience: "Projetos de faculdade",
    motivation: "Quero começar cedo",
    selfPromotion: "Proativo",
    interestJustification: "Gosto de tecnologia",
    accepted: false,
    interests: ["projetos"],
  });

  await seedApplication({
    candidateId: "7",
    recruitmentId: currentRecruitment.id,
    studentNumber: 202100005,
    phone: "910000005",
    degree: "leic",
    curricularYear: "2bsc",
    experience: "Desenvolvimento web",
    motivation: "Quero evoluir",
    selfPromotion: "Trabalho em equipa",
    interestJustification: "Interesse em projetos",
    accepted: false,
    interests: ["website"],
  });

  const currentApp6 = await seedApplication({
    candidateId: "8",
    recruitmentId: currentRecruitment.id,
    studentNumber: 202100006,
    phone: "910000006",
    degree: "meic",
    curricularYear: "1msc",
    experience: "Estágio de verão",
    motivation: "Quero contribuir",
    selfPromotion: "Experiência sólida",
    interestJustification: "Alinhamento total",
    accepted: true,
    interests: ["projetos", "website"],
    tagIds: [tagWeb.id],
  });

  const currentApp7 = await seedApplication({
    candidateId: "9",
    recruitmentId: currentRecruitment.id,
    studentNumber: 202100007,
    phone: "910000007",
    degree: "leic",
    curricularYear: "1bsc",
    experience: "Pouca experiência",
    motivation: "Ainda a explorar",
    selfPromotion: "Vontade de aprender",
    interestJustification: "Curiosidade",
    accepted: false,
    interests: ["comunicacao"],
  });

  await db.insert(appreciation).values([
    { applicationId: currentApp6, recruiterId: "3", grade: 3 },
    { applicationId: currentApp7, recruiterId: "3", grade: 1 },
  ]);

  // Current interviews
  const currentInterview1 = await seedInterview({
    recruitmentId: currentRecruitment.id,
    candidateId: "1",
    slotId: slotInterview1,
    content: "Olá, entrevista 2026/2027!",
    locked: false,
    recruiterIds: ["3"],
  });
  await seedInterview({
    recruitmentId: currentRecruitment.id,
    candidateId: "7",
    slotId: slotInterview5,
    content: "Entrevista 2026/2027 - Candidato 5",
    locked: false,
    recruiterIds: ["3"],
  });
  await seedInterview({
    recruitmentId: currentRecruitment.id,
    candidateId: "8",
    slotId: slotInterview6,
    content: "Entrevista 2026/2027 - Candidato 6",
    locked: true,
    recruiterIds: ["3"],
  });
  await seedInterview({
    recruitmentId: currentRecruitment.id,
    candidateId: "9",
    slotId: slotInterview7,
    content: "Entrevista 2026/2027 - Candidato 7",
    locked: true,
    recruiterIds: ["3"],
  });

  await db.insert(interviewComment).values({
    interviewId: currentInterview1,
    authorId: "3",
    content: [{ type: "paragraph", content: "Boa primeira impressão" }],
  });

  // Current dynamics
  const currentDynamic1 = await seedDynamic({
    recruitmentId: currentRecruitment.id,
    slotId: slotDynamic1,
    content: "Dinâmica de grupo 2026/2027",
    candidateIds: ["1"],
    recruiterIds: ["3"],
  });
  await seedDynamic({
    recruitmentId: currentRecruitment.id,
    slotId: slotDynamic2,
    content: "Dinâmica de grupo 2026/2027 - grupo 2",
    candidateIds: ["8", "9"],
    recruiterIds: ["3"],
  });
  await db.insert(dynamicComment).values({
    dynamicId: currentDynamic1,
    authorId: "3",
    content: [{ type: "paragraph", content: "Participação ativa" }],
  });

  // Current voting: 1 pending, 8 accepted, 9 rejected
  await seedVotingPhase(
    currentRecruitment.id,
    [
      { candidateId: "1", voteFinished: false, accepted: 1, rejected: 0 },
      { candidateId: "6", voteFinished: false, accepted: 0, rejected: 0 },
      { candidateId: "7", voteFinished: false, accepted: 0, rejected: 0 },
      {
        candidateId: "8",
        voteFinished: true,
        vote: "approve",
        accepted: 3,
        rejected: 0,
      },
      {
        candidateId: "9",
        voteFinished: true,
        vote: "reject",
        accepted: 0,
        rejected: 3,
      },
    ],
    ["3"],
  );

  await db
    .update(candidate)
    .set({
      interviewClassification: "muito forte",
      dynamicClassification: "normal",
    })
    .where(
      and(
        eq(candidate.userId, "1"),
        eq(candidate.recruitmentId, currentRecruitment.id),
      ),
    );
  await db
    .update(candidate)
    .set({ interviewClassification: "normal", dynamicClassification: "none" })
    .where(
      and(
        eq(candidate.userId, "7"),
        eq(candidate.recruitmentId, currentRecruitment.id),
      ),
    );
  await db
    .update(candidate)
    .set({
      interviewClassification: "muito forte",
      dynamicClassification: "muito forte",
    })
    .where(
      and(
        eq(candidate.userId, "8"),
        eq(candidate.recruitmentId, currentRecruitment.id),
      ),
    );
  await db
    .update(candidate)
    .set({
      interviewClassification: "muito fraco",
      dynamicClassification: "muito fraco",
    })
    .where(
      and(
        eq(candidate.userId, "9"),
        eq(candidate.recruitmentId, currentRecruitment.id),
      ),
    );

  // ── Recruiter availability ───────────────────────────────────────
  await db.insert(recruiterAvailability).values({
    start: new Date("2026-09-15T09:00:00.000Z"),
    duration: 180,
    recruiterId: "3",
    recruitmentId: currentRecruitment.id,
  });
  await db.insert(recruiterAvailability).values({
    start: new Date("2026-09-16T14:00:00.000Z"),
    duration: 120,
    recruiterId: "12",
    recruitmentId: currentRecruitment.id,
  });

  // ── Notifications (read + unread) ────────────────────────────────
  await db.insert(notification).values([
    {
      userId: "1",
      type: "phase_unlocked",
      data: { phase: "Entrevista" },
      isRead: false,
    },
    {
      userId: "1",
      type: "phase_unlocked",
      data: { phase: "Candidatura" },
      isRead: true,
    },
    {
      userId: "8",
      type: "voting",
      data: { result: "accepted" },
      isRead: false,
    },
    {
      userId: "9",
      type: "voting",
      data: { result: "rejected" },
      isRead: false,
    },
  ]);

  // ── Final message templates ──────────────────────────────────────
  await db.insert(finalMessageTemplate).values({
    type: "approved",
    content: [{ type: "paragraph", content: "Parabéns! Foste aceite no NI!" }],
  });
  await db.insert(finalMessageTemplate).values({
    type: "rejected",
    content: [
      {
        type: "paragraph",
        content: "Infelizmente não foste selecionado desta vez.",
      },
    ],
  });

  console.log("Seed completed successfully!");
  console.log("");
  console.log("Recruitments:");
  console.log(`  Past:    ${pastLectiveYear} (Sem 1) - Inactive`);
  console.log(`  Current: ${currentLectiveYear} (Sem 1) - Active`);
  console.log("");
  console.log(`All accounts use the password: ${PASSWORD}`);
  console.log("");
  console.log("Candidates:");
  console.log(
    "  candidato1@test.com  (1)  re-applicant | past accepted | current in progress (interview+dynamic booked, voting open -> result PENDING)",
  );
  console.log(
    "  candidato2@test.com  (2)  past accepted only | no current application",
  );
  console.log(
    "  candidato3@test.com  (5)  registered, never applied (can apply)",
  );
  console.log(
    "  candidato4@test.com  (6)  current: applied, nothing scheduled",
  );
  console.log(
    "  candidato5@test.com  (7)  current: applied + interview booked, dynamic pending",
  );
  console.log(
    "  candidato6@test.com  (8)  current: fully processed -> ACCEPTED (result approved)",
  );
  console.log(
    "  candidato7@test.com  (9)  current: fully processed -> REJECTED (result rejected)",
  );
  console.log(
    "  candidato8@test.com  (10) past rejected only | no current application",
  );
  console.log("");
  console.log("Recruiters:");
  console.log(
    "  recrutador@test.com  (3)  past + current | availability set | assigned | voted",
  );
  console.log(
    "  recrutador2@test.com (11) current only | no availability | no assignments",
  );
  console.log(
    "  recrutador3@test.com (12) current only | availability set | no assignments",
  );
  console.log("");
  console.log("Admin:");
  console.log("  admin@test.com       (4)  platform admin");
}

main();
