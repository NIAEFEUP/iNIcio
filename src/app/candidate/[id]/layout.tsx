import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSession } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { getTargetRecruitmentId } from "@/lib/selected-recruitment";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function DynamicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const targetRecruitmentId = await getTargetRecruitmentId();

  if (!(await isRecruiter(session.user.id, targetRecruitmentId))) {
    redirect("/");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
