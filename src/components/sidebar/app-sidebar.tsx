"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import OpenDayAdminClient from "@/components/admin/open-day-admin-client";
import { RecruitmentManagerDialog } from "@/components/recruitment/recruitment-manager-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { User as UserType } from "@/hooks/use-auth";
import { useRecruitment } from "@/lib/contexts/recruitment-context";
import { updateRecruitment } from "@/lib/recruitment-actions";
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
  const router = useRouter();

  const { recruitmentId, selectRecruitment } = useRecruitment();

  const selectedRecruitment = React.useMemo(() => {
    const currentId = recruitmentId ?? recruitments?.[0]?.id;
    return recruitments?.find((r) => r.id === currentId) ?? recruitments?.[0];
  }, [recruitmentId, recruitments]);

  const openManager = React.useCallback((mode: RecruitmentManagerMode) => {
    setManagerMode(mode);
    setManagerOpen(true);
  }, []);

  const handleOpenDaySave = React.useCallback(
    async (input: {
      openDayEnabled: boolean;
      openDayDate: string | null;
      openDayStartTime: string;
      openDayEndTime: string;
      openDayRoom: string;
      openDayImage: string;
    }) => {
      if (!selectedRecruitment) return;

      await updateRecruitment(selectedRecruitment.id, {
        lectiveYear: `${selectedRecruitment.year}/${selectedRecruitment.year + 1}`,
        semester: selectedRecruitment.semester,
        title: selectedRecruitment.title,
        start: selectedRecruitment.start,
        end: selectedRecruitment.end,
        active: selectedRecruitment.active,
        openDayEnabled: input.openDayEnabled,
        openDayDate: input.openDayDate,
        openDayStartTime: input.openDayStartTime,
        openDayEndTime: input.openDayEndTime,
        openDayRoom: input.openDayRoom,
        openDayImage: input.openDayImage,
      });

      setOpenDayOpen(false);
      router.refresh();
    },
    [router, selectedRecruitment],
  );

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
            currentPath={currentPath}
            isRecruiter={isRecruiter}
            isAdmin={isAdmin}
            user={user}
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
        <Dialog open={openDayOpen} onOpenChange={setOpenDayOpen}>
          <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
            <OpenDayAdminClient
              recruitment={{
                id: selectedRecruitment.id,
                lectiveYear: `${selectedRecruitment.year}/${selectedRecruitment.year + 1}`,
                semester: selectedRecruitment.semester,
                title: selectedRecruitment.title,
                start: new Date(selectedRecruitment.start),
                end: new Date(selectedRecruitment.end),
                active: selectedRecruitment.active,
                openDayEnabled: selectedRecruitment.openDayEnabled ?? false,
                openDayDate: selectedRecruitment.openDayDate
                  ? new Date(selectedRecruitment.openDayDate)
                  : null,
                openDayStartTime:
                  selectedRecruitment.openDayStartTime ?? "10:00",
                openDayEndTime: selectedRecruitment.openDayEndTime ?? "18:00",
                openDayRoom: selectedRecruitment.openDayRoom ?? "B315",
                openDayImage:
                  selectedRecruitment.openDayImage ?? "/images/B315.jpeg",
              }}
              onSave={handleOpenDaySave}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
