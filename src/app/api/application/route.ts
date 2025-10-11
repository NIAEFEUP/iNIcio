import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db, getRecruitmentCandidatePhases } from "@/lib/db";

import {
  application,
  applicationInterests,
  recruitmentPhaseStatus,
  user,
} from "@/db/schema";
import { candidate } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { fromFullUrlToPath } from "@/lib/file-upload";
import { redirect } from "next/navigation";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  redirect("/");

  if (!session) return new Response("Unauthorized", { status: 401 });

  const json = await req.json();

  await db.transaction(async (tx) => {
    const app = await tx
      .insert(application)
      .values({
        fullName: json.fullname,
        submittedAt: new Date(),
        studentNumber: json.student_number,
        linkedIn: json.linkedIn,
        github: json.github,
        personalWebsite: json.personal_website,
        interestJustification: json.interest_justification,
        phone: json.phone,
        studentYear: json.student_year,
        degree: json.degree,
        curricularYear: json.curricular_year,
        profilePicture: fromFullUrlToPath(json.profile_picture),
        curriculum: fromFullUrlToPath(json.curriculum),
        experience: json.experience,
        motivation: json.motivation,
        selfPromotion: json.self_promotion,
        suggestions: json.suggestions,
        accepted: false,
        candidateId: session.user.id,
      })
      .returning({ id: application.id });

    if (json.profile_picture) {
      await tx
        .update(user)
        .set({
          image: json.profile_picture,
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));
    }

    for (const interest of json.interests) {
      await tx.insert(applicationInterests).values({
        applicationId: app[0].id,
        interest: interest,
      });
    }

    await tx.insert(candidate).values({ userId: session.user.id });

    const phases = await getRecruitmentCandidatePhases();

    for (const phase of phases) {
      await tx.insert(recruitmentPhaseStatus).values({
        userId: session.user.id,
        phaseId: phase.id,
        status: "todo",
      });
    }
  });

  return new Response();
}
