import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/lib/db";

import {
  application,
  applicationInterests,
  recruiterToCandidate,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { areFriends } from "@/lib/friend";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const json = await req.json();

  await db.transaction(async (tx) => {
    const app = await tx
      .insert(application)
      .values({
        submittedAt: new Date(),
        studentNumber: json.student_number,
        linkedIn: json.linkedIn,
        github: json.github,
        personalWebsite: json.personal_website,
        phone: json.phone,
        studentYear: json.student_year,
        degree: json.degree,
        curricularYear: json.curricular_year,
        profilePicture: json.profile_picture,
        curriculum: json.curriculum,
        experience: json.experience,
        motivation: json.motivation,
        selfPromotion: json.self_promotion,
        suggestions: json.suggestions,
        accepted: false,
        candidateId: "1",
      })
      .returning({ id: application.id });

    // for (const interest of json.interests) {
    //   await tx.insert(applicationInterests).values({
    //     applicationId: app[0].id,
    //     interest: interest,
    //   });
    // }
  });

  return new Response();
}
