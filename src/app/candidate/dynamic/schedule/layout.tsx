import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getActiveRecruitment,
  isRecruitmentPhaseOpen,
  RECRUITMENT_PHASE_IDENTIFIERS,
} from "@/lib/recruitment";

export default async function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const activeRecruitment = await getActiveRecruitment();
  if (!activeRecruitment) {
    redirect("/candidate/progress");
  }

  if (
    !(await isRecruitmentPhaseOpen(
      RECRUITMENT_PHASE_IDENTIFIERS.dynamic,
      activeRecruitment.id,
    ))
  ) {
    redirect("/candidate/progress");
  }

  const d = await db.query.candidateToDynamic.findFirst({
    where: (ctoDynamic, { eq, and }) =>
      and(
        eq(ctoDynamic.candidateId, session?.user?.id),
        eq(ctoDynamic.recruitmentId, activeRecruitment.id),
      ),
  });

  if (d !== undefined && d !== null) {
    redirect("/candidate/progress");
  }

  return <>{children}</>;
}
