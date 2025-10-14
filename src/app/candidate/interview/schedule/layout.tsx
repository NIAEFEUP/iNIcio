import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { and, isNotNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

  const i = await db.query.interview.findFirst({
    where: (interview, { eq }) =>
      and(
        isNotNull(interview.slot),
        eq(interview.candidateId, session?.user?.id),
      ),
  });

  if (i !== undefined && i !== null) {
    redirect("/");
  }

  return <>{children}</>;
}
