"use client";

import * as React from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { type RecruitmentOption } from "@/components/sidebar/sidebar-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RecruitmentProvider } from "@/lib/contexts/recruitment-context";
import type { User as UserType } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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

  const activeUser = user !== undefined ? user : auth.user;
  const activeIsAuthenticated =
    isAuthenticated !== undefined ? isAuthenticated : auth.isAuthenticated;
  const activeIsAdmin = isAdmin !== undefined ? isAdmin : activeUser?.isAdmin;
  const activeIsRecruiter =
    isRecruiter !== undefined ? isRecruiter : activeUser?.isRecruiter;
  const activeLogout = onLogout ?? auth.logout;
  const activePath = currentPath ?? pathname ?? "";

  const isImmersivePage =
    /^\/candidate\/[^/]+\/interview(\/.*)?$/.test(activePath) ||
    /^\/dynamic\/[^/]+(\/.*)?$/.test(activePath);

  return (
    <RecruitmentProvider
      initialRecruitmentId={selectedRecruitmentId}
      onSelectRecruitment={onSelectRecruitment}
    >
      <SidebarProvider defaultOpen={defaultOpen}>
        {!isImmersivePage && (
          <AppSidebar
            user={activeUser}
            isAuthenticated={activeIsAuthenticated}
            isAdmin={activeIsAdmin}
            isRecruiter={activeIsRecruiter}
            onLogout={activeLogout}
            currentPath={activePath}
            recruitments={recruitments}
          />
        )}
        <SidebarInset
          className={cn(isImmersivePage && "h-dvh max-h-dvh overflow-hidden")}
        >
          <div
            className={cn(
              "flex-1 p-6 py-4",
              isImmersivePage &&
                "flex flex-col h-full min-h-0 overflow-hidden p-4 sm:p-6",
            )}
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RecruitmentProvider>
  );
}
