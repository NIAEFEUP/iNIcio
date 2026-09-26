import { DashboardShell } from "@/components/layout/dashboard-shell";
import { isAdmin } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!(await isAdmin(session?.user.id))) {
    redirect("/");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
