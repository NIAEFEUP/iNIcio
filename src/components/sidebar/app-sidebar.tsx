"use client";

import * as React from "react";
import { RecruitmentManagerDialog } from "@/components/recruitment/recruitment-manager-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { User as UserType } from "@/hooks/use-auth";
import { useRecruitment } from "@/lib/contexts/recruitment-context";
import { SidebarContentComponent } from "./sidebar-content";
import { SidebarFooterComponent } from "./sidebar-footer";
import {
  SidebarHeaderComponent,
  type RecruitmentManagerMode,
  type RecruitmentOption,
} from "./sidebar-header";

export interface AppSidebarProps {
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

export function AppSidebar({
  user,
  isAuthenticated = false,
  isAdmin = false,
  isRecruiter = false,
  onLogout,
  currentPath = "",
  recruitments,
  selectedRecruitmentId,
  onSelectRecruitment,
}: AppSidebarProps) {
  const [managerOpen, setManagerOpen] = React.useState(false);
  const [managerMode, setManagerMode] =
    React.useState<RecruitmentManagerMode>("overview");

  const { recruitmentId: contextRecruitmentId, selectRecruitment } =
    useRecruitment();

  const effectiveRecruitmentId = selectedRecruitmentId ?? contextRecruitmentId;
  const effectiveSelectRecruitment = onSelectRecruitment ?? selectRecruitment;

  const openManager = React.useCallback((mode: RecruitmentManagerMode) => {
    setManagerMode(mode);
    setManagerOpen(true);
  }, []);

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarHeaderComponent
            recruitments={recruitments}
            selectedRecruitmentId={effectiveRecruitmentId}
            onSelectRecruitment={effectiveSelectRecruitment}
            onOpenManager={openManager}
            isAdmin={isAdmin}
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarContentComponent
            currentPath={currentPath}
            isRecruiter={isRecruiter}
            isAdmin={isAdmin}
            user={user}
          />
        </SidebarContent>
        <SidebarFooter className="border-t border-border/60">
          <SidebarFooterComponent
            user={user}
            isAuthenticated={isAuthenticated}
            onLogout={onLogout}
          />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <RecruitmentManagerDialog
        key={`${managerMode}-${managerOpen}`}
        open={managerOpen}
        onOpenChange={setManagerOpen}
        recruitments={recruitments ?? []}
        initialMode={managerMode}
      />
    </>
  );
}
