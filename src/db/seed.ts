import { db } from "@/lib/db";
import {
  user,
  candidate,
  recruiterToCandidate,
  recruiter,
  account,
  application,
  recruitmentPhase,
} from "./schema";

async function main() {
  await db.delete(recruitmentPhase);
  await db.delete(recruiterToCandidate);
  await db.delete(application);
  await db.delete(candidate);
  await db.delete(recruiter);
  await db.delete(account);
  await db.delete(user);

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
}

main();
