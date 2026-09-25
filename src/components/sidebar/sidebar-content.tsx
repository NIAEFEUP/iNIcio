"use client";

import {
  Calendar,
  CalendarClock,
  Clock,
  DoorOpen,
  FileText,
  LayoutDashboard,
  Layers,
  MessageSquare,
  UserCheck,
  UserCog,
  Users,
  UsersRound,
  Vote,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { User as UserType } from "@/hooks/use-auth";

interface SidebarContentProps {
  currentPath?: string;
  isRecruiter?: boolean;
  isAdmin?: boolean;
  user?: UserType | null;
  onOpenOpenDay?: () => void;
}

type IconType = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

interface NavItem {
  title: string;
  path?: string;
  icon: IconType;
  exact?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

function isActivePath(activePath: string, path?: string, exact?: boolean) {
  if (!path) return false;
  if (exact || path === "/admin") return activePath === path;
  return activePath === path || activePath.startsWith(`${path}/`);
}

export function SidebarContentComponent({
  currentPath,
  isRecruiter = false,
  isAdmin = false,
  user,
  onOpenOpenDay,
}: SidebarContentProps) {
  const pathname = usePathname();
  const activePath = currentPath || pathname || "";

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
      icon: Clock,
    },
    ...(user?.id
      ? [
          {
            title: "Alocações",
            path: `/calendar/${user.id}`,
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
  ];

  const eventSections: NavItem[] = [
    {
      title: "NI Open Day",
      icon: DoorOpen,
      exact: true,
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
      {isAdmin && renderGroup("Eventos", eventSections)}
      {isAdmin && renderGroup("Plataforma", platformSections)}
    </>
  );
}
