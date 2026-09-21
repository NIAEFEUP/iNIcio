import { DashboardShell } from "@/components/layout/dashboard-shell";
import { auth } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function FriendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/");
  }

  const targetRecruitmentId = await getTargetRecruitmentId();

  if (!(await isRecruiter(session.user.id, targetRecruitmentId))) {
    return redirect("/");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
