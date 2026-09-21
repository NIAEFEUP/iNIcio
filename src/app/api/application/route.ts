import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { db } from "@/lib/db";

import {
  application,
  applicationInterests,
  candidate,
  recruitment,
  recruitmentPhase,
  recruitmentPhaseStatus,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { fromFullUrlToPath } from "@/lib/file-upload";
import { z } from "zod";
import {
  availableCourses,
  availableCurricularYears,
  availableInterests,
} from "@/lib/constants";
import { getActiveRecruitment } from "@/lib/recruitment";
import { getRecruitmentState } from "@/lib/recruitment-state";
import { isRecruiter } from "@/lib/recruiter";

const requiredText = z.string().min(1);

const applicationSchema = z.object({
  student_number: z
    .union([z.string(), z.number()])
    .refine((value) => /^\d+$/.test(String(value).trim()), {
      message: "student_number must be a positive integer",
    })
    .transform((value) => Number(String(value).trim()))
    .refine((value) => value > 0 && value <= 2147483647, {
      message: "student_number is out of range",
    }),
  phone: requiredText,
  degree: z.string().refine((value) => availableCourses.includes(value), {
    message: "Invalid degree",
  }),
  curricular_year: z
    .string()
    .refine((value) => availableCurricularYears.includes(value), {
      message: "Invalid curricular year",
    }),
  curriculum: z.string().default(""),
  interests: z
    .array(
      z.string().refine((value) => availableInterests.includes(value), {
        message: "Invalid interest",
      }),
    )
    .default([]),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  website: z.string().optional(),
  interest_justification: requiredText,
  experience: z.string().optional(),
  motivation: requiredText,
  self_promotion: requiredText,
  suggestions: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return new Response("Unauthorized", { status: 401 });

  if (!session.user.image) {
    return NextResponse.json(
      {
        error: "É necessário ter uma fotografia de perfil para se candidatar.",
      },
      { status: 403 },
    );
  }

  if (await isRecruiter(session.user.id))
    return new Response("Forbidden", { status: 403 });

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

  const activeRecruitment = await getActiveRecruitment();
  if (!activeRecruitment) {
    return NextResponse.json(
      { error: "Não existe nenhum recrutamento ativo" },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const result = await db.transaction(async (tx) => {
    // Lock the target recruitment so eligibility cannot change between the
    // check and the writes, even if an admin switches/closes it concurrently.
    const [target] = await tx
      .select()
      .from(recruitment)
      .where(eq(recruitment.id, activeRecruitment.id))
      .for("update");

    if (!target) {
      return {
        ok: false as const,
        status: 400,
        error: "Não existe nenhum recrutamento ativo",
      };
    }

    const phases = await tx
      .select()
      .from(recruitmentPhase)
      .where(eq(recruitmentPhase.recruitmentId, target.id))
      .for("update");

    if (!getRecruitmentState(target, phases).canApply) {
      return {
        ok: false as const,
        status: 403,
        error: "As candidaturas não estão abertas",
      };
    }

    const app = await tx
      .insert(application)
      .values({
        submittedAt: new Date(),
        studentNumber: Number(data.student_number),
        linkedIn: data.linkedin,
        github: data.github,
        personalWebsite: data.website,
        interestJustification: data.interest_justification,
        phone: data.phone,
        degree: data.degree,
        curricularYear: data.curricular_year,
        curriculum: fromFullUrlToPath(data.curriculum),
        experience: data.experience,
        motivation: data.motivation,
        selfPromotion: data.self_promotion,
        suggestions: data.suggestions,
        accepted: false,
        candidateId: session.user.id,
        recruitmentId: target.id,
      })
      .onConflictDoNothing()
      .returning({ id: application.id });

    if (app.length === 0) {
      return {
        ok: false as const,
        status: 409,
        error: "Já existe uma candidatura para este recrutamento",
      };
    }

    for (const interest of data.interests) {
      await tx.insert(applicationInterests).values({
        applicationId: app[0].id,
        interest,
      });
    }

    await tx
      .insert(candidate)
      .values({
        userId: session.user.id,
        recruitmentId: target.id,
      })
      .onConflictDoNothing();

    for (const phase of phases) {
      if (phase.role !== "candidate") continue;

      await tx
        .insert(recruitmentPhaseStatus)
        .values({
          userId: session.user.id,
          phaseId: phase.id,
          status: "todo",
        })
        .onConflictDoNothing();
    }

    return { ok: true as const };
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ success: true });
}
