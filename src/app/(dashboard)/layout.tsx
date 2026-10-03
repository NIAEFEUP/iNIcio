import { DashboardShell } from "@/components/layout/dashboard-shell";
import { isAdmin } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const [userIsAdmin, userIsRecruiter] = await Promise.all([
    isAdmin(session.user.id),
    isRecruiter(session.user.id),
  ]);

  if (!userIsAdmin && !userIsRecruiter) {
    redirect("/");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
