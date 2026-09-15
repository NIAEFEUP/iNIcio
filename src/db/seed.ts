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

async function main() {
  const currentLectiveYear = "2026/2027";
  const pastLectiveYear = "2025/2026";

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

  // ── Users ────────────────────────────────────────────────────────
  const now = new Date();

  await db.insert(user).values({
    id: "1",
    name: "Candidato 1",
    email: "candidato1@test.com",
    emailVerified: true,
    role: "candidate",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(user).values({
    id: "2",
    name: "Candidato 2",
    email: "candidato2@test.com",
    emailVerified: true,
    role: "candidate",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(user).values({
    id: "3",
    name: "Recrutador 1",
    email: "recrutador@test.com",
    emailVerified: true,
    role: "recruiter",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(user).values({
    id: "4",
    name: "Admin",
    email: "admin@test.com",
    emailVerified: true,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  });

  // ── Global platform roles ─────────────────────────────────────────
  await db.insert(recruiter).values({ userId: "3" });
  await db.insert(admin).values({ userId: "4" });

  // ── Accounts (password: testeteste) ──────────────────────────────
  const hashed = await hashPassword("testeteste");

  for (const id of ["1", "2", "3", "4"]) {
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

  // ── Past recruitment (2025/2026 Semester 1 - completed, inactive) ─
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

  // Enrolled users for past recruitment
  await db.insert(usersToRecruitments).values({
    userId: "3",
    recruitmentId: pastRecruitment.id,
  });

  // Past candidate entries
  await db.insert(candidate).values({
    userId: "1",
    recruitmentId: pastRecruitment.id,
  });
  await db.insert(candidate).values({
    userId: "2",
    recruitmentId: pastRecruitment.id,
  });

  await db.insert(recruiterToCandidate).values({
    recruiterId: "3",
    candidateId: "1",
    recruitmentId: pastRecruitment.id,
  });
  await db.insert(recruiterToCandidate).values({
    recruiterId: "3",
    candidateId: "2",
    recruitmentId: pastRecruitment.id,
  });

  const [pastPhase1] = await db
    .insert(recruitmentPhase)
    .values({
      recruitmentId: pastRecruitment.id,
      role: "candidate",
      start: new Date("2025-09-01T00:00:00.000Z"),
      end: new Date("2025-09-15T00:00:00.000Z"),
      title: "Candidatura",
      clientIdentifier: "candidatura",
      description: "Submete a tua candidatura",
    })
    .returning({ id: recruitmentPhase.id });

  const [pastPhase2] = await db
    .insert(recruitmentPhase)
    .values({
      recruitmentId: pastRecruitment.id,
      role: "recruiter",
      start: new Date("2025-09-01T00:00:00.000Z"),
      end: new Date("2025-09-15T00:00:00.000Z"),
      title: "Avaliação de Candidaturas",
      clientIdentifier: "avaliacao",
      description: "Avalia as candidaturas recebidas",
    })
    .returning({ id: recruitmentPhase.id });

  const [pastPhase3] = await db
    .insert(recruitmentPhase)
    .values({
      recruitmentId: pastRecruitment.id,
      role: "candidate",
      start: new Date("2025-09-15T00:00:00.000Z"),
      end: new Date("2025-09-30T00:00:00.000Z"),
      title: "Entrevista",
      clientIdentifier: "entrevista",
      description: "Marca a tua entrevista",
    })
    .returning({ id: recruitmentPhase.id });

  const [pastPhase4] = await db
    .insert(recruitmentPhase)
    .values({
      recruitmentId: pastRecruitment.id,
      role: "candidate",
      start: new Date("2025-09-15T00:00:00.000Z"),
      end: new Date("2025-09-30T00:00:00.000Z"),
      title: "Dinâmica",
      clientIdentifier: "dinâmica",
      description: "Participa na dinâmica de grupo",
    })
    .returning({ id: recruitmentPhase.id });

  for (const phaseId of [
    pastPhase1.id,
    pastPhase2.id,
    pastPhase3.id,
    pastPhase4.id,
  ]) {
    await db.insert(recruitmentPhaseStatus).values({
      userId: "1",
      phaseId,
      status: "done",
    });
    await db.insert(recruitmentPhaseStatus).values({
      userId: "2",
      phaseId,
      status: "done",
    });
  }

  // ── Past slots ───────────────────────────────────────────────────
  const [pastSlot1] = await db
    .insert(slot)
    .values({
      start: new Date("2025-09-20T10:00:00.000Z"),
      duration: 30,
      type: "interview",
      recruitmentId: pastRecruitment.id,
    })
    .returning({ id: slot.id });

  const [pastSlot2] = await db
    .insert(slot)
    .values({
      start: new Date("2025-09-20T14:00:00.000Z"),
      duration: 60,
      type: "dynamic",
      recruitmentId: pastRecruitment.id,
    })
    .returning({ id: slot.id });

  const [pastSlot3] = await db
    .insert(slot)
    .values({
      start: new Date("2025-09-21T10:00:00.000Z"),
      duration: 45,
      type: "interview-dynamic",
      recruitmentId: pastRecruitment.id,
    })
    .returning({ id: slot.id });

  // ── Past applications ────────────────────────────────────────────
  const [pastApp1] = await db
    .insert(application)
    .values({
      candidateId: "1",
      recruitmentId: pastRecruitment.id,
      studentNumber: 202100001,
      fullName: "Candidato 1",
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
    })
    .returning({ id: application.id });

  const [pastApp2] = await db
    .insert(application)
    .values({
      candidateId: "2",
      recruitmentId: pastRecruitment.id,
      studentNumber: 202100002,
      fullName: "Candidato 2",
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
    })
    .returning({ id: application.id });

  await db.insert(applicationInterests).values({
    applicationId: pastApp1.id,
    interest: "projetos",
  });
  await db.insert(applicationInterests).values({
    applicationId: pastApp1.id,
    interest: "website",
  });
  await db.insert(applicationInterests).values({
    applicationId: pastApp2.id,
    interest: "comunicacao",
  });

  const [tagWeb] = await db
    .insert(tag)
    .values({ name: "web" })
    .returning({ id: tag.id });
  const [tagMobile] = await db
    .insert(tag)
    .values({ name: "mobile" })
    .returning({ id: tag.id });

  await db.insert(applicationToTag).values({
    applicationId: pastApp1.id,
    tagId: tagWeb.id,
  });
  await db.insert(applicationToTag).values({
    applicationId: pastApp2.id,
    tagId: tagMobile.id,
  });

  await db.insert(appreciation).values({
    applicationId: pastApp1.id,
    recruiterId: "3",
    grade: 3,
  });
  await db.insert(appreciation).values({
    applicationId: pastApp2.id,
    recruiterId: "3",
    grade: 2,
  });

  await db.insert(applicationComment).values({
    applicationId: pastApp1.id,
    authorId: "3",
    content: [{ type: "paragraph", content: "Candidato forte" }],
  });

  // ── Past interviews ──────────────────────────────────────────────
  const [pastInterview1] = await db
    .insert(interview)
    .values({
      content: [
        { type: "paragraph", content: "Entrevista passada - Candidato 1" },
      ],
      candidateId: "1",
      recruitmentId: pastRecruitment.id,
      slot: pastSlot1.id,
      locked: true,
    })
    .returning({ id: interview.id });

  const [pastInterview2] = await db
    .insert(interview)
    .values({
      content: [
        { type: "paragraph", content: "Entrevista passada - Candidato 2" },
      ],
      candidateId: "2",
      recruitmentId: pastRecruitment.id,
      slot: pastSlot3.id,
      locked: true,
    })
    .returning({ id: interview.id });

  await db.insert(recruiterToInterview).values({
    recruiterId: "3",
    interviewId: pastInterview1.id,
  });
  await db.insert(recruiterToInterview).values({
    recruiterId: "3",
    interviewId: pastInterview2.id,
  });

  await db.insert(interviewComment).values({
    interviewId: pastInterview1.id,
    authorId: "3",
    content: [{ type: "paragraph", content: "Excelente prestação" }],
  });

  // ── Past dynamics ────────────────────────────────────────────────
  const [pastDynamic] = await db
    .insert(dynamic)
    .values({
      content: [{ type: "paragraph", content: "Dinâmica passada" }],
      slot: pastSlot2.id,
      recruitmentId: pastRecruitment.id,
    })
    .returning({ id: dynamic.id });

  await db.insert(candidateToDynamic).values({
    candidateId: "1",
    dynamicId: pastDynamic.id,
    recruitmentId: pastRecruitment.id,
  });
  await db.insert(candidateToDynamic).values({
    candidateId: "2",
    dynamicId: pastDynamic.id,
    recruitmentId: pastRecruitment.id,
  });

  await db.insert(recruiterToDynamic).values({
    recruiterId: "3",
    dynamicId: pastDynamic.id,
  });

  await db.insert(dynamicComment).values({
    dynamicId: pastDynamic.id,
    authorId: "3",
    content: [{ type: "paragraph", content: "Bom trabalho em equipa" }],
  });

  // ── Past voting (completed, both approved) ───────────────────────
  const [pastVoting] = await db
    .insert(votingPhase)
    .values({ recruitmentId: pastRecruitment.id })
    .returning({ id: votingPhase.id });

  await db.insert(votingPhaseCandidate).values({
    votingPhaseId: pastVoting.id,
    candidateId: "1",
    voteFinished: true,
  });
  await db.insert(votingPhaseCandidate).values({
    votingPhaseId: pastVoting.id,
    candidateId: "2",
    voteFinished: true,
  });

  await db.insert(votingPhaseStatus).values({
    votingPhaseId: pastVoting.id,
    candidateId: "1",
    accepted_candidates: 3,
    rejected_candidates: 0,
  });
  await db.insert(votingPhaseStatus).values({
    votingPhaseId: pastVoting.id,
    candidateId: "2",
    accepted_candidates: 2,
    rejected_candidates: 1,
  });

  await db.insert(candidateVote).values({
    votingPhaseId: pastVoting.id,
    candidateId: "1",
    decision: "approve",
  });
  await db.insert(candidateVote).values({
    votingPhaseId: pastVoting.id,
    candidateId: "2",
    decision: "approve",
  });
  await db.insert(recruiterVote).values({
    votingPhaseId: pastVoting.id,
    recruiterId: "3",
    candidateId: "1",
  });
  await db.insert(recruiterVote).values({
    votingPhaseId: pastVoting.id,
    recruiterId: "3",
    candidateId: "2",
  });

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

  // ── Current active recruitment (2026/2027 Semester 1) ────────────
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

  // Recruiter 1 enrolled in current recruitment
  await db.insert(usersToRecruitments).values({
    userId: "3",
    recruitmentId: currentRecruitment.id,
  });

  // Candidate 1 reapplied in current recruitment!
  await db.insert(candidate).values({
    userId: "1",
    recruitmentId: currentRecruitment.id,
  });

  await db.insert(recruiterToCandidate).values({
    recruiterId: "3",
    candidateId: "1",
    recruitmentId: currentRecruitment.id,
  });

  // ── Current phases ───────────────────────────────────────────────
  const [phase1] = await db
    .insert(recruitmentPhase)
    .values({
      recruitmentId: currentRecruitment.id,
      role: "candidate",
      start: new Date("2026-09-01T00:00:00.000Z"),
      end: new Date("2026-09-10T00:00:00.000Z"),
      title: "Candidatura",
      clientIdentifier: "candidatura",
      description: "Submete a tua candidatura",
    })
    .returning({ id: recruitmentPhase.id });

  const [phase2] = await db
    .insert(recruitmentPhase)
    .values({
      recruitmentId: currentRecruitment.id,
      role: "recruiter",
      start: new Date("2026-09-01T00:00:00.000Z"),
      end: new Date("2026-09-10T00:00:00.000Z"),
      title: "Avaliação de Candidaturas",
      clientIdentifier: "avaliacao",
      description: "Avalia as candidaturas recebidas",
    })
    .returning({ id: recruitmentPhase.id });

  const [phase3] = await db
    .insert(recruitmentPhase)
    .values({
      recruitmentId: currentRecruitment.id,
      role: "candidate",
      start: new Date("2026-09-10T00:00:00.000Z"),
      end: new Date("2026-09-20T00:00:00.000Z"),
      title: "Entrevista",
      clientIdentifier: "entrevista",
      description: "Marca a tua entrevista",
    })
    .returning({ id: recruitmentPhase.id });

  const [phase4] = await db
    .insert(recruitmentPhase)
    .values({
      recruitmentId: currentRecruitment.id,
      role: "candidate",
      start: new Date("2026-09-10T00:00:00.000Z"),
      end: new Date("2026-09-20T00:00:00.000Z"),
      title: "Dinâmica",
      clientIdentifier: "dinâmica",
      description: "Participa na dinâmica de grupo",
    })
    .returning({ id: recruitmentPhase.id });

  const [phase5] = await db
    .insert(recruitmentPhase)
    .values({
      recruitmentId: currentRecruitment.id,
      role: "recruiter",
      start: new Date("2026-09-20T00:00:00.000Z"),
      end: new Date("2026-09-30T00:00:00.000Z"),
      title: "Votação",
      clientIdentifier: "votacao",
      description: "Vota sobre os candidatos",
    })
    .returning({ id: recruitmentPhase.id });

  // Phase statuses for Candidate 1 in current recruitment
  await db.insert(recruitmentPhaseStatus).values({
    userId: "1",
    phaseId: phase1.id,
    status: "done",
  });
  await db.insert(recruitmentPhaseStatus).values({
    userId: "1",
    phaseId: phase2.id,
    status: "done",
  });
  await db.insert(recruitmentPhaseStatus).values({
    userId: "1",
    phaseId: phase3.id,
    status: "done",
  });
  await db.insert(recruitmentPhaseStatus).values({
    userId: "1",
    phaseId: phase4.id,
    status: "todo",
  });
  await db.insert(recruitmentPhaseStatus).values({
    userId: "1",
    phaseId: phase5.id,
    status: "blocked",
  });

  // ── Current slots ────────────────────────────────────────────────
  const [slot1] = await db
    .insert(slot)
    .values({
      start: new Date("2026-09-15T10:00:00.000Z"),
      duration: 30,
      type: "interview",
      recruitmentId: currentRecruitment.id,
    })
    .returning({ id: slot.id });

  await db.insert(slot).values({
    start: new Date("2026-09-15T11:00:00.000Z"),
    duration: 30,
    type: "interview",
    recruitmentId: currentRecruitment.id,
  });

  const [slot3] = await db
    .insert(slot)
    .values({
      start: new Date("2026-09-16T14:00:00.000Z"),
      duration: 60,
      type: "dynamic",
      recruitmentId: currentRecruitment.id,
    })
    .returning({ id: slot.id });

  await db.insert(slot).values({
    start: new Date("2026-09-17T10:00:00.000Z"),
    duration: 45,
    type: "interview-dynamic",
    recruitmentId: currentRecruitment.id,
  });

  // ── Recruiter availability ───────────────────────────────────────
  await db.insert(recruiterAvailability).values({
    start: new Date("2026-09-15T09:00:00.000Z"),
    duration: 180,
    recruiterId: "3",
    recruitmentId: currentRecruitment.id,
  });

  // ── Current application (Candidate 1 in 2026/2027) ────────────────
  const [currentApp1] = await db
    .insert(application)
    .values({
      candidateId: "1",
      recruitmentId: currentRecruitment.id,
      studentNumber: 202100001,
      fullName: "Candidato 1",
      linkedIn: "https://linkedin.com/in/candidato1",
      github: "https://github.com/candidato1",
      phone: "910000001",
      degree: "meic",
      curricularYear: "4msc",
      experience: "3 anos de desenvolvimento web",
      motivation: "Re-candidatura para continuar a contribuir para o NIAEFEUP",
      selfPromotion: "Gosto de projetos open source e mentoria",
      interestJustification: "O NIAEFEUP alinha com os meus interesses",
      suggestions: "Nenhuma",
      accepted: false,
    })
    .returning({ id: application.id });

  await db.insert(applicationInterests).values({
    applicationId: currentApp1.id,
    interest: "projetos",
  });
  await db.insert(applicationInterests).values({
    applicationId: currentApp1.id,
    interest: "website",
  });

  // ── Current interview ────────────────────────────────────────────
  const [currentInterview] = await db
    .insert(interview)
    .values({
      content: [{ type: "paragraph", content: "Olá, entrevista 2026/2027!" }],
      candidateId: "1",
      recruitmentId: currentRecruitment.id,
      slot: slot1.id,
      locked: false,
    })
    .returning({ id: interview.id });

  await db.insert(recruiterToInterview).values({
    recruiterId: "3",
    interviewId: currentInterview.id,
  });

  // ── Current dynamic ──────────────────────────────────────────────
  const [currentDynamic] = await db
    .insert(dynamic)
    .values({
      content: [{ type: "paragraph", content: "Dinâmica de grupo 2026/2027" }],
      slot: slot3.id,
      recruitmentId: currentRecruitment.id,
    })
    .returning({ id: dynamic.id });

  await db.insert(candidateToDynamic).values({
    candidateId: "1",
    dynamicId: currentDynamic.id,
    recruitmentId: currentRecruitment.id,
  });

  await db.insert(recruiterToDynamic).values({
    recruiterId: "3",
    dynamicId: currentDynamic.id,
  });

  // ── Current voting (in progress) ─────────────────────────────────
  const [currentVoting] = await db
    .insert(votingPhase)
    .values({ recruitmentId: currentRecruitment.id })
    .returning({ id: votingPhase.id });

  await db.insert(votingPhaseCandidate).values({
    votingPhaseId: currentVoting.id,
    candidateId: "1",
    voteFinished: false,
  });

  await db.insert(votingPhaseStatus).values({
    votingPhaseId: currentVoting.id,
    candidateId: "1",
    accepted_candidates: 1,
    rejected_candidates: 0,
  });

  // ── Notifications ────────────────────────────────────────────────
  await db.insert(notification).values({
    userId: "1",
    type: "phase_unlocked",
    data: { phase: "Entrevista" },
    isRead: false,
  });

  // ── Final message templates ──────────────────────────────────────
  await db.insert(finalMessageTemplate).values({
    type: "approved",
    content: [
      {
        type: "paragraph",
        content: "Parabéns! Foste aceite no NI!",
      },
    ],
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
  console.log("Recruitments created:");
  console.log(`  Past:    ${pastLectiveYear} (Sem 1) - Inactive`);
  console.log(`  Current: ${currentLectiveYear} (Sem 1) - Active`);
  console.log("");
  console.log("Users created:");
  console.log("  Admin:      admin@test.com     (password: testeteste)");
  console.log("  Recruiter:  recrutador@test.com (password: testeteste)");
  console.log(
    "  Candidate1: candidato1@test.com (password: testeteste) [applied in both years]",
  );
  console.log(
    "  Candidate2: candidato2@test.com (password: testeteste) [applied in past year only]",
  );
}

main();
