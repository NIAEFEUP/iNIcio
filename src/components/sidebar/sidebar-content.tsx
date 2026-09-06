"use client";

import {
  Briefcase,
  Calendar,
  Clock,
  FileText,
  Home,
  Layers,
  MessageSquare,
  UserCheck,
  Users,
  Vote,
} from "lucide-react";
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

interface SidebarContentProps {
  currentPath?: string;
}

export function SidebarContentComponent({ currentPath }: SidebarContentProps) {
  const pathname = usePathname();
  const activePath = currentPath || pathname || "";

  const adminSections = [
    {
      group: "Geral",
      items: [
        { title: "Dashboard", path: "/admin", icon: Home },
        {
          title: "Recrutamentos",
          path: "/admin/recruitments",
          icon: Briefcase,
        },
        { title: "Fases", path: "/admin/phases", icon: Layers },
      ],
    },
    {
      group: "Pessoas & Votações",
      items: [
        { title: "Recrutadores", path: "/admin/recruiters", icon: Users },
        { title: "Candidatos", path: "/candidates", icon: UserCheck },
        { title: "Votações", path: "/candidates/voting", icon: Vote },
      ],
    },
    {
      group: "Agendamentos",
      items: [
        { title: "Slots", path: "/admin/interviews", icon: Calendar },
        {
          title: "Disponibilidades",
          path: "/admin/availabilities",
          icon: Clock,
        },
      ],
    },
    {
      group: "Configurações",
      items: [
        { title: "Templates", path: "/admin/templates", icon: FileText },
        {
          title: "Mensagens Finais",
          path: "/admin/final-messages",
          icon: MessageSquare,
        },
      ],
    },
  ];

  return (
    <>
      {adminSections.map((section) => (
        <SidebarGroup key={section.group}>
          <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePath === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      render={<Link href={item.path} />}
                      isActive={isActive}
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
      ))}
    </>
  );
}
