"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CalendarClock,
  CalendarRange,
  Clock,
  DoorOpen,
  FileText,
  Layers,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  UserCheck,
  UserCog,
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
  onOpenOpenDay,
}: SidebarContentProps) {
  const activePath = usePathname();
  const canRecruit = isRecruiter || isAdmin;

  const personalSections: NavItem[] = [
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
    ...(userId
      ? [
          {
            title: "A Minha Agenda",
            path: `/calendar/${userId}`,
            icon: Calendar,
          },
        ]
      : []),
    {
      title: "A Minha Disponibilidade",
      path: "/recruiter/availability",
      icon: CalendarClock,
    },
    {
      title: "O Meu Progresso",
      path: "/recruiter/progress",
      icon: ListChecks,
      exact: true,
    },
  ];

  const selectionSections: NavItem[] = [
    { title: "Candidatos", path: "/candidates", icon: UserCheck, exact: true },
    { title: "Votações", path: "/candidates/voting", icon: Vote },
  ];

  const recruitmentManagementSections: NavItem[] = [
    { title: "Dashboard", path: "/admin", icon: LayoutDashboard, exact: true },
    { title: "Fases", path: "/admin/phases", icon: Layers },
    { title: "Recrutadores", path: "/admin/recruiters", icon: UserCog },
    {
      title: "Disponibilidade da Equipa",
      path: "/admin/availabilities",
      icon: CalendarRange,
    },
    { title: "Horários & Slots", path: "/admin/interviews", icon: Clock },
    { title: "Modelos", path: "/admin/templates", icon: FileText },
    {
      title: "Mensagens Finais",
      path: "/admin/final-messages",
      icon: MessageSquare,
    },
    {
      title: "Open Day",
      icon: DoorOpen,
      onSelect: onOpenOpenDay,
    },
  ];

  const systemSections: NavItem[] = [
    { title: "Utilizadores", path: "/admin/users", icon: UsersRound },
  ];

  const renderGroup = (label: string, items: NavItem[]) => {
    if (items.length === 0) return null;

    return (
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
                      tooltip={item.title}
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
                    <SidebarMenuButton
                      onClick={item.onSelect}
                      tooltip={item.title}
                    >
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
                    tooltip={item.title}
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
  };

  return (
    <>
      {canRecruit && renderGroup("Área Pessoal", personalSections)}
      {canRecruit && renderGroup("Seleção", selectionSections)}
      {isAdmin &&
        renderGroup("Gestão do Recrutamento", recruitmentManagementSections)}
      {isAdmin && renderGroup("Sistema", systemSections)}
    </>
  );
}
