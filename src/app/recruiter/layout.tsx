import { DashboardShell } from "@/components/layout/dashboard-shell";
import { auth } from "@/lib/auth";
import { isRecruiter } from "@/lib/recruiter";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RecruiterLayout({
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

  if (!(await isRecruiter(session?.user.id))) {
    redirect("/");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
