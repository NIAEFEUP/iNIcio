import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { getRecruitments } from "@/lib/recruitment";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarLayout } from "@/components/layout/sidebar-layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!(await isAdmin(session?.user.id))) {
    redirect("/");
  }

  const user = session?.user
    ? {
        ...session.user,
        isAdmin: true,
      }
    : null;

  const rawRecruitments = await getRecruitments();
  const recruitments = rawRecruitments.map((r) => ({
    year: Number.parseInt(r.lectiveYear, 10),
    active: r.active,
    start: r.start.toISOString(),
    end: r.end.toISOString(),
  }));

  return (
    <SidebarLayout
      user={user}
      isAuthenticated={true}
      recruitments={recruitments}
    >
      {children}
    </SidebarLayout>
  );
}
