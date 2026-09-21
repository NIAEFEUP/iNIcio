"use client";

import * as React from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { type RecruitmentOption } from "@/components/sidebar/sidebar-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { setSelectedRecruitment } from "@/cookies/set";
import type { User as UserType } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";

export interface SidebarLayoutProps {
  children?: React.ReactNode;
  user?: UserType | null;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
  isRecruiter?: boolean;
  onLogout?: () => Promise<void>;
  currentPath?: string;
  recruitments?: RecruitmentOption[];
  selectedRecruitmentId?: number;
  onSelectRecruitment?: (id: number) => void;
  defaultOpen?: boolean;
}

export function SidebarLayout({
  children,
  user,
  isAuthenticated,
  isAdmin,
  isRecruiter,
  onLogout,
  currentPath,
  recruitments,
  selectedRecruitmentId,
  onSelectRecruitment,
  defaultOpen = true,
}: SidebarLayoutProps) {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const activeUser = user !== undefined ? user : auth.user;
  const activeIsAuthenticated =
    isAuthenticated !== undefined ? isAuthenticated : auth.isAuthenticated;
  const activeIsAdmin = isAdmin !== undefined ? isAdmin : activeUser?.isAdmin;
  const activeIsRecruiter =
    isRecruiter !== undefined ? isRecruiter : activeUser?.isRecruiter;
  const activeLogout = onLogout ?? auth.logout;
  const activePath = currentPath ?? pathname ?? "";
  const activeSelectRecruitment =
    onSelectRecruitment ??
    ((id: number) => {
      setSelectedRecruitment(id);
      router.refresh();
    });

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        user={activeUser}
        isAuthenticated={activeIsAuthenticated}
        isAdmin={activeIsAdmin}
        isRecruiter={activeIsRecruiter}
        onLogout={activeLogout}
        currentPath={activePath}
        recruitments={recruitments}
        selectedRecruitmentId={selectedRecruitmentId}
        onSelectRecruitment={activeSelectRecruitment}
      />
      <SidebarInset>
        <div className="flex-1 p-6 py-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
