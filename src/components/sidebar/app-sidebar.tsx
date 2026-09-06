"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import type { User as UserType } from "@/hooks/use-auth";
import { SidebarContentComponent } from "./sidebar-content";
import { SidebarFooterComponent } from "./sidebar-footer";
import {
  SidebarHeaderComponent,
  type RecruitmentOption,
} from "./sidebar-header";

export interface AppSidebarProps {
  user?: UserType | null;
  isAuthenticated?: boolean;
  onLogout?: () => Promise<void>;
  currentPath?: string;
  recruitments?: RecruitmentOption[];
  selectedYear?: number;
  onSelectRecruitment?: (year: number) => void;
}

export function AppSidebar({
  user,
  isAuthenticated = false,
  onLogout,
  currentPath = "",
  recruitments,
  selectedYear,
  onSelectRecruitment,
}: AppSidebarProps) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarHeaderComponent
          recruitments={recruitments}
          selectedYear={selectedYear}
          onSelectRecruitment={onSelectRecruitment}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarContentComponent currentPath={currentPath} />
      </SidebarContent>
      <SidebarFooter className="border-t border-border/60">
        <SidebarFooterComponent
          user={user}
          isAuthenticated={isAuthenticated}
          onLogout={onLogout}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
