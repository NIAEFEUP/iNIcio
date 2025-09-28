import { auth } from "@/lib/auth";
import { isCandidate } from "@/lib/candidate";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CandidateProgressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return redirect("/login");
  }

  if (!(await isCandidate(session.user.id))) {
    redirect("/");
  }

  return <>{children}</>;
}
