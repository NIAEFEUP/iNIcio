import type { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import type { RecruitmentOption } from "@/components/sidebar/sidebar-header";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { getRecruitmentIdsForUser, getRecruitments } from "@/lib/recruitment";
import { isRecruiter } from "@/lib/recruiter";
import { getSelectedRecruitmentId } from "@/lib/selected-recruitment";

export async function DashboardShell({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user?.id;

  const [
    rawRecruitments,
    selectedRecruitmentId,
    userIsAdmin,
    userIsRecruiter,
    userRecruitmentIds,
  ] = await Promise.all([
    getRecruitments(),
    getSelectedRecruitmentId(),
    isAdmin(userId),
    isRecruiter(userId),
    getRecruitmentIdsForUser(userId),
  ]);

  const visibleRecruitments =
    userIsAdmin || userRecruitmentIds.length === 0
      ? rawRecruitments
      : rawRecruitments.filter((r) => userRecruitmentIds.includes(r.id));

  const isActive = (value: boolean | string) =>
    value === true || value === "true";

  const recruitments: RecruitmentOption[] = visibleRecruitments.map((r) => ({
    id: r.id,
    year: Number.parseInt(r.lectiveYear, 10),
    semester: r.semester,
    title: r.title,
    active: isActive(r.active),
    start: r.start.toISOString(),
    end: r.end.toISOString(),
    openDayEnabled: Boolean(r.openDayEnabled),
    openDayDate: r.openDayDate ? r.openDayDate.toISOString() : null,
    openDayStartTime: r.openDayStartTime || "10:00",
    openDayEndTime: r.openDayEndTime || "18:00",
    openDayRoom: r.openDayRoom || "B315",
    openDayImage: r.openDayImage || "/images/B315.jpeg",
  }));

  const user = session?.user
    ? {
        ...session.user,
        isAdmin: Boolean(userIsAdmin),
        isRecruiter: Boolean(userIsRecruiter),
      }
    : null;

  return (
    <SidebarLayout
      user={user}
      isAuthenticated={Boolean(session?.user)}
      isAdmin={Boolean(userIsAdmin)}
      isRecruiter={Boolean(userIsRecruiter)}
      recruitments={recruitments}
      selectedRecruitmentId={selectedRecruitmentId ?? undefined}
      defaultOpen={defaultOpen}
    >
      {children}
    </SidebarLayout>
  );
}
