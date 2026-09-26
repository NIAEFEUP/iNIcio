"use client";

import * as React from "react";
import { RecruitmentManagerDialog } from "@/components/recruitment/recruitment-manager-dialog";
import { OpenDayModal } from "@/components/admin/open-day-modal";
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
}

export function AppSidebar({
  user,
  isAuthenticated = false,
  isAdmin = false,
  isRecruiter = false,
  onLogout,
  currentPath = "",
  recruitments,
}: AppSidebarProps) {
  const [managerOpen, setManagerOpen] = React.useState(false);
  const [managerMode, setManagerMode] =
    React.useState<RecruitmentManagerMode>("overview");
  const [openDayOpen, setOpenDayOpen] = React.useState(false);

  const { recruitmentId, selectRecruitment } = useRecruitment();

  const selectedRecruitment = React.useMemo(() => {
    const currentId = recruitmentId ?? recruitments?.[0]?.id;
    return recruitments?.find((r) => r.id === currentId) ?? recruitments?.[0];
  }, [recruitmentId, recruitments]);

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
            selectedRecruitmentId={recruitmentId ?? undefined}
            onSelectRecruitment={selectRecruitment}
            onOpenManager={openManager}
            isAdmin={isAdmin}
          />
        </SidebarHeader>
        <SidebarContent>
          <SidebarContentComponent
            userId={user?.id}
            isRecruiter={isRecruiter}
            isAdmin={isAdmin}
            currentRecruitmentId={selectedRecruitment?.id}
            onOpenOpenDay={() => setOpenDayOpen(true)}
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

      {selectedRecruitment && isAdmin && (
        <OpenDayModal
          open={openDayOpen}
          onOpenChange={setOpenDayOpen}
          recruitmentId={selectedRecruitment.id}
        />
      )}
    </>
  );
}
