import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/lib/db";

import {
  application,
  applicationInterests,
  candidate,
  recruitmentPhase,
  recruitmentPhaseStatus,
  user,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { fromFullUrlToPath } from "@/lib/file-upload";
import { z } from "zod";

const applicationSchema = z.object({
  fullname: z.string().min(1),
  student_number: z
    .union([z.string(), z.number()])
    .refine((value) => value !== "" && !Number.isNaN(Number(value)), {
      message: "student_number must be numeric",
    }),
  phone: z.string().optional(),
  degree: z.string().optional(),
  curricular_year: z.string().optional(),
  profile_picture: z.string().default(""),
  curriculum: z.string().default(""),
  interests: z.array(z.string()).default([]),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  website: z.string().optional(),
  interest_justification: z.string().optional(),
  experience: z.string().optional(),
  motivation: z.string().optional(),
  self_promotion: z.string().optional(),
  suggestions: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return new Response("Unauthorized", { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = applicationSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid application payload" },
      { status: 400 },
    );
  }

  const data = parsed.data;

  await db.transaction(async (tx) => {
    const app = await tx
      .insert(application)
      .values({
        fullName: data.fullname,
        submittedAt: new Date(),
        studentNumber: Number(data.student_number),
        linkedIn: data.linkedin,
        github: data.github,
        personalWebsite: data.website,
        interestJustification: data.interest_justification,
        phone: data.phone,
        degree: data.degree,
        curricularYear: data.curricular_year,
        profilePicture: fromFullUrlToPath(data.profile_picture),
        curriculum: fromFullUrlToPath(data.curriculum),
        experience: data.experience,
        motivation: data.motivation,
        selfPromotion: data.self_promotion,
        suggestions: data.suggestions,
        accepted: false,
        candidateId: session.user.id,
      })
      .returning({ id: application.id });

    if (data.profile_picture) {
      await tx
        .update(user)
        .set({
          image: data.profile_picture,
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));
    }

    for (const interest of data.interests) {
      await tx.insert(applicationInterests).values({
        applicationId: app[0].id,
        interest,
      });
    }

    await tx.insert(candidate).values({ userId: session.user.id });

    const phases = await tx
      .select()
      .from(recruitmentPhase)
      .where(eq(recruitmentPhase.role, "candidate"));

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
