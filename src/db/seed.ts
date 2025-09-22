import { db } from "@/lib/db";
import {
  user,
  candidate,
  recruiterToCandidate,
  recruiter,
  account,
  application,
  recruitmentPhase,
  recruitment,
  slot,
  interview,
  dynamic,
  recruitmentPhaseStatus,
} from "./schema";

async function main() {
  await db.delete(interview);
  await db.delete(dynamic);
  await db.delete(slot);
  await db.delete(recruitmentPhaseStatus);
  await db.delete(recruitmentPhase);
  await db.delete(recruiterToCandidate);
  await db.delete(application);
  await db.delete(candidate);
  await db.delete(recruiter);
  await db.delete(account);
  await db.delete(user);
  await db.delete(recruitment);

  await db.insert(user).values({
    id: "1",
    name: "Candidato 1",
    email: "utilizador@utilizador",
    emailVerified: true,
    image:
      "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSsuz2-gtje6NEAJQN1o9Nt-2vqFFuzXiuSa66ySKTnCKso2JPquWNlrGgC5ejIHyad3Itp5h2XkSESUmj1SZgHhCIFVa1ZuDm4efLyEUqz",
    role: "candidate",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(user).values({
    id: "2",
    name: "Candidato 2",
    email: "candidato2@utilizador",
    emailVerified: true,
    image:
      "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSsuz2-gtje6NEAJQN1o9Nt-2vqFFuzXiuSa66ySKTnCKso2JPquWNlrGgC5ejIHyad3Itp5h2XkSESUmj1SZgHhCIFVa1ZuDm4efLyEUqz",
    role: "candidate",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(candidate).values({
    userId: "1",
  });

  await db.insert(candidate).values({
    userId: "2",
  });

  // await db.insert(recruiter).values({
  //   userId: "3",
  // });

  await db.insert(application).values({
    candidateId: "1",
    submittedAt: new Date(),
    studentNumber: 1,
    linkedIn: "https://www.linkedin.com/in/tomas-palma-dev/",
    github: "https://github.com/tomaspalma",
    personalWebsite: "https://tomaspalma.dev",
    accepted: false,
  });

  await db.insert(recruitment).values({
    year: 2025,
    active: "true",
  });

  await db.insert(recruitmentPhase).values({
    recruitmentYear: 2025,
    role: "candidate",
    start: new Date(),
    end: new Date("2025-09-30T16:00:00.000Z"),
    title: "Entrevista",
    description: "Marca a tua entrevista",
  });

  await db.insert(recruitmentPhase).values({
    recruitmentYear: 2025,
    role: "candidate",
    start: new Date(),
    end: new Date("2025-09-30T16:00:00.000Z"),
    title: "Dinâmica",
    description: "Marca a tua dinâmica",
  });

  await db.insert(slot).values({
    id: 1,
    start: new Date("2025-09-30T01:00:00.000Z"),
    duration: 30,
    type: "interview",
    recruitmentYear: 2025,
  });

  await db.insert(slot).values({
    id: 2,
    start: new Date("2025-09-30T10:00:00.000Z"),
    duration: 30,
    type: "interview",
    recruitmentYear: 2025,
  });

  await db.insert(slot).values({
    id: 3,
    start: new Date("2025-09-30T16:00:00.000Z"),
    duration: 30,
    type: "interview",
    recruitmentYear: 2025,
  });

  await db.insert(slot).values({
    id: 4,
    start: new Date("2025-09-30T16:00:00.000Z"),
    duration: 30,
    type: "dynamic",
    recruitmentYear: 2025,
  });

  await db.insert(slot).values({
    id: 5,
    start: new Date("2025-09-30T16:00:00.000Z"),
    duration: 30,
    type: "interview-dynamic",
    recruitmentYear: 2025,
  });

  await db.insert(interview).values({
    content: [
      {
        type: "paragraph",
        content: "Olá, tudo bem?",
      },
    ],
    candidateId: "1",
    slot: 1,
  });
}

main();
