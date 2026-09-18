"use client";

import * as React from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { type RecruitmentOption } from "@/components/sidebar/sidebar-header";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toast";
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
    <SidebarProvider>
      <Toaster />
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
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 lg:hidden">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex-1 p-6 py-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
