import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSession } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { redirect } from "next/navigation";

export default async function FriendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    return redirect("/");
  }

  const targetRecruitmentId = await getTargetRecruitmentId();

  if (!(await isRecruiter(session.user.id, targetRecruitmentId))) {
    return redirect("/");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
