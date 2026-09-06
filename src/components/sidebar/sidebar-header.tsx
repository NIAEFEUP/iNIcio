"use client";

import { Briefcase, Check, ChevronsUpDown, Search, Shield } from "lucide-react";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export interface RecruitmentOption {
  year: number;
  active?: string | boolean;
  start?: Date | string;
  end?: Date | string;
}

export interface SidebarHeaderProps {
  recruitments?: RecruitmentOption[];
  selectedYear?: number;
  onSelectRecruitment?: (year: number) => void;
}

function getMacSnapshot() {
  const platform = (
    (navigator as unknown as { userAgentData?: { platform?: string } })
      .userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent ||
    ""
  ).toLowerCase();
  return platform.includes("mac");
}

function useIsMac() {
  return React.useSyncExternalStore(
    () => () => {},
    getMacSnapshot,
    () => false,
  );
}

export function SidebarHeaderComponent({
  recruitments: initialRecruitments,
  selectedYear: controlledSelectedYear,
  onSelectRecruitment,
}: SidebarHeaderProps) {
  const { isMobile } = useSidebar();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "";
  const isMac = useIsMac();

  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const recruitments: RecruitmentOption[] = React.useMemo(() => {
    if (initialRecruitments && initialRecruitments.length > 0) {
      return [...initialRecruitments].sort((a, b) => b.year - a.year);
    }
    const currentYear = new Date().getFullYear();
    return [
      { year: currentYear, active: "true" },
      { year: currentYear - 1, active: "false" },
    ];
  }, [initialRecruitments]);

  const defaultYear = React.useMemo(() => {
    const activeOne = recruitments.find(
      (r) => r.active === "true" || r.active === true,
    );
    return activeOne
      ? activeOne.year
      : (recruitments[0]?.year ?? new Date().getFullYear());
  }, [recruitments]);

  const [internalSelectedYear, setInternalSelectedYear] =
    React.useState<number>(defaultYear);

  const selectedYear = controlledSelectedYear ?? internalSelectedYear;

  const handleSelect = React.useCallback(
    (year: number) => {
      setInternalSelectedYear(year);
      onSelectRecruitment?.(year);
      setIsOpen(false);
    },
    [onSelectRecruitment],
  );

  const activeRecruitment = React.useMemo(
    () => recruitments.find((r) => r.year === selectedYear) ?? recruitments[0],
    [recruitments, selectedYear],
  );

  const isAdminPath = pathname.startsWith("/admin");

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        if (event.key === "0" && user?.isAdmin) {
          event.preventDefault();
          router.push("/admin");
          setIsOpen(false);
          return;
        }

        if (recruitments.length <= 9) {
          const digit = parseInt(event.key, 10);
          if (
            !Number.isNaN(digit) &&
            digit >= 1 &&
            digit <= recruitments.length
          ) {
            const target = recruitments[digit - 1];
            if (target) {
              event.preventDefault();
              handleSelect(target.year);
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [recruitments, user?.isAdmin, router, handleSelect]);

  const filteredRecruitments = React.useMemo(() => {
    if (!search.trim()) return recruitments;
    const query = search.toLowerCase().trim();
    return recruitments.filter((r) => {
      const yearMatch = r.year.toString().includes(query);
      const statusText =
        r.active === "true" || r.active === true ? "ativo" : "inativo";
      return yearMatch || statusText.includes(query);
    });
  }, [recruitments, search]);

  const hasShortcuts = recruitments.length <= 9;

  const isCurrentActive =
    activeRecruitment?.active === "true" || activeRecruitment?.active === true;

  const headerTitle = activeRecruitment
    ? `Recrutamento ${activeRecruitment.year}`
    : "Recrutamento";
  const headerSubtitle = isCurrentActive
    ? "Recrutamento Ativo"
    : "Recrutamento Inativo";
  const headerInitials = activeRecruitment
    ? String(activeRecruitment.year).slice(-2)
    : "RC";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setSearch("");
            }
          }}
        >
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-xs">
                    {headerInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{headerTitle}</span>
                    {isCurrentActive && (
                      <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </div>
                  <span className="truncate text-xs text-muted-foreground">
                    {headerSubtitle}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 opacity-50" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-72 min-w-64 p-2 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {user?.isAdmin && (
              <DropdownMenuGroup>
                <DropdownMenuLabel>Administração</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    router.push("/admin");
                    setIsOpen(false);
                  }}
                  className={cn(
                    isAdminPath &&
                      pathname === "/admin" &&
                      "bg-accent text-accent-foreground font-medium",
                  )}
                >
                  <Avatar className="h-6 w-6 rounded-sm shrink-0 after:rounded-sm">
                    <AvatarFallback className="rounded-sm bg-primary/10 text-primary text-[10px] font-semibold">
                      <Shield className="h-3.5 w-3.5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-xs truncate">
                      Dashboard Geral
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      Painel de Controlo
                    </span>
                  </div>
                  <DropdownMenuShortcut>
                    {isMac ? "⌘0" : "Ctrl+0"}
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
            )}

            <DropdownMenuGroup>
              <div className="flex items-center justify-between px-1.5 py-1">
                <DropdownMenuLabel className="p-0">
                  Recrutamentos
                </DropdownMenuLabel>
                {recruitments.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {recruitments.length} disponíveis
                  </span>
                )}
              </div>

              {recruitments.length > 0 ? (
                <>
                  <div className="p-1 pb-1.5">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Pesquisar recrutamentos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="h-8 pl-8 pr-2 text-xs"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-0.5 mt-0.5">
                    {filteredRecruitments.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        Nenhum recrutamento encontrado
                      </div>
                    ) : (
                      filteredRecruitments.map((r) => {
                        const originalIndex = recruitments.findIndex(
                          (item) => item.year === r.year,
                        );
                        const shortcutKey =
                          hasShortcuts &&
                          originalIndex >= 0 &&
                          originalIndex < 9
                            ? originalIndex + 1
                            : null;
                        const isSelected = r.year === selectedYear;
                        const isActive =
                          r.active === "true" || r.active === true;

                        return (
                          <DropdownMenuItem
                            key={r.year}
                            onClick={() => handleSelect(r.year)}
                            className={cn(
                              isSelected &&
                                "bg-accent text-accent-foreground font-medium",
                            )}
                          >
                            <Avatar className="h-6 w-6 rounded-sm shrink-0 after:rounded-sm">
                              <AvatarFallback className="rounded-sm bg-primary/10 text-primary text-[10px] font-semibold">
                                {String(r.year).slice(-2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-xs truncate">
                                  Recrutamento {r.year}
                                </span>
                                {isActive && (
                                  <Badge
                                    variant="outline"
                                    className="h-4 px-1 text-[9px] font-normal border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                  >
                                    Ativo
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground truncate">
                                {isActive
                                  ? "Recrutamento em curso"
                                  : "Recrutamento anterior"}
                              </span>
                            </div>

                            {isSelected && (
                              <Check className="size-3.5 text-primary shrink-0 mr-1" />
                            )}

                            {shortcutKey !== null && (
                              <DropdownMenuShortcut>
                                {isMac
                                  ? `⌘${shortcutKey}`
                                  : `Ctrl+${shortcutKey}`}
                              </DropdownMenuShortcut>
                            )}
                          </DropdownMenuItem>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  Nenhum recrutamento configurado
                </div>
              )}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  router.push("/admin/recruitments");
                  setIsOpen(false);
                }}
              >
                <Avatar className="h-6 w-6 rounded-sm shrink-0 after:rounded-sm">
                  <AvatarFallback className="rounded-sm bg-muted text-muted-foreground text-[10px]">
                    <Briefcase className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium text-xs truncate">
                    Gerir Recrutamentos
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    Criar novo ou editar existentes
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
