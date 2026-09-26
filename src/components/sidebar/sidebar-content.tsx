"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  Clock,
  DoorOpen,
  FileText,
  Layers,
  LayoutDashboard,
  MessageSquare,
  UserCheck,
  UserCog,
  Users,
  UsersRound,
  Vote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export interface NavItem {
  title: string;
  path?: string;
  icon: LucideIcon;
  exact?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface SidebarContentProps {
  userId?: string;
  isAdmin?: boolean;
  isRecruiter?: boolean;
  currentRecruitmentId?: number;
  onOpenOpenDay?: () => void;
}

function isActivePath(
  currentPath: string,
  targetPath?: string,
  exact = false,
): boolean {
  if (!targetPath) return false;
  if (exact) return currentPath === targetPath;
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export function SidebarContentComponent({
  userId,
  isAdmin = false,
  isRecruiter = false,
  currentRecruitmentId,
  onOpenOpenDay,
}: SidebarContentProps) {
  const activePath = usePathname();
  const canRecruit = isRecruiter || isAdmin;

  const recruiterSections: NavItem[] = [
    ...(!isAdmin
      ? [
          {
            title: "Dashboard",
            path: "/recruiter",
            icon: LayoutDashboard,
            exact: true,
          },
        ]
      : []),
    {
      title: "Disponibilidades",
      path: "/recruiter/availability",
      icon: CalendarClock,
    },
    ...(userId
      ? [
          {
            title: "Alocações",
            path: `/calendar/${userId}`,
            icon: Calendar,
          },
        ]
      : []),
    { title: "Candidatos", path: "/candidates", icon: UserCheck, exact: true },
    { title: "Votações", path: "/candidates/voting", icon: Vote },
  ];

  const adminSections: NavItem[] = [
    { title: "Dashboard", path: "/admin", icon: LayoutDashboard },
    {
      title: "Disponibilidades",
      path: "/admin/availabilities",
      icon: CalendarClock,
    },
    { title: "Fases", path: "/admin/phases", icon: Layers },
    { title: "Slots", path: "/admin/interviews", icon: Users },
    { title: "Recrutadores", path: "/admin/recruiters", icon: UserCog },
    {
      title: "Open Day",
      icon: DoorOpen,
      onSelect: onOpenOpenDay,
    },
  ];

  const platformSections: NavItem[] = [
    { title: "Documentos", path: "/admin/templates", icon: FileText },
    {
      title: "Mensagens Finais",
      path: "/admin/final-messages",
      icon: MessageSquare,
    },
    { title: "Utilizadores", icon: UsersRound, disabled: true },
  ];

  const renderGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    disabled
                    className="opacity-60 cursor-default"
                  >
                    <Icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }
            if (item.onSelect) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={item.onSelect}>
                    <Icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<Link href={item.path!} />}
                  isActive={isActivePath(activePath, item.path, item.exact)}
                >
                  <Icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <>
      {canRecruit && renderGroup("Recrutador", recruiterSections)}
      {isAdmin && renderGroup("Recrutamento", adminSections)}
      {isAdmin && renderGroup("Plataforma", platformSections)}
    </>
  );
}
