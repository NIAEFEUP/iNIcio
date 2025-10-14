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

  const d = await db.query.candidateToDynamic.findFirst({
    where: (ctoDynamic, { eq }) =>
      eq(ctoDynamic.candidateId, session?.user?.id),
  });

  if (d !== undefined && d !== null) {
    redirect("/");
  }

  return <>{children}</>;
}
