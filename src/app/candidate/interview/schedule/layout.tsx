import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isNotNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getActiveRecruitment } from "@/lib/recruitment";

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

  const i = await db.query.interview.findFirst({
    where: (interview, { eq, and }) =>
      and(
        isNotNull(interview.slot),
        eq(interview.candidateId, session?.user?.id),
        eq(interview.recruitmentId, activeRecruitment.id),
      ),
  });

  if (i !== undefined && i !== null) {
    redirect("/candidate/progress");
  }

  return <>{children}</>;
}
