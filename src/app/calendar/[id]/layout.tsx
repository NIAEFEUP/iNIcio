import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSession } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export default async function CalendarLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;

  const session = await getSession();
  if (!(await isAdmin(session?.user.id)) && session?.user.id !== id) {
    redirect("/");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
