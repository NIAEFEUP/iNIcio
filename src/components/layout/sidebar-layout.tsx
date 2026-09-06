"use client";

import * as React from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { type RecruitmentOption } from "@/components/sidebar/sidebar-header";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { User as UserType } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { usePathname } from "next/navigation";

export interface SidebarLayoutProps {
  children?: React.ReactNode;
  user?: UserType | null;
  isAuthenticated?: boolean;
  onLogout?: () => Promise<void>;
  currentPath?: string;
  recruitments?: RecruitmentOption[];
  selectedRecruitmentYear?: number;
  onSelectRecruitment?: (year: number) => void;
}

export function SidebarLayout({
  children,
  user,
  isAuthenticated,
  onLogout,
  currentPath,
  recruitments,
  selectedRecruitmentYear,
  onSelectRecruitment,
}: SidebarLayoutProps) {
  const auth = useAuth();
  const pathname = usePathname();

  const activeUser = user !== undefined ? user : auth.user;
  const activeIsAuthenticated =
    isAuthenticated !== undefined ? isAuthenticated : auth.isAuthenticated;
  const activeLogout = onLogout ?? auth.logout;
  const activePath = currentPath ?? pathname ?? "";

  return (
    <SidebarProvider>
      <AppSidebar
        user={activeUser}
        isAuthenticated={activeIsAuthenticated}
        onLogout={activeLogout}
        currentPath={activePath}
        recruitments={recruitments}
        selectedYear={selectedRecruitmentYear}
        onSelectRecruitment={onSelectRecruitment}
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
