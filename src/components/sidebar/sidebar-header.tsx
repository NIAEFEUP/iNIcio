"use client";

import { Briefcase, Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  id: number;
  year: number;
  semester: number;
  title: string;
  active: boolean;
  start: string;
  end: string;
}

export type RecruitmentManagerMode = "overview" | "create";

export interface SidebarHeaderProps {
  recruitments?: RecruitmentOption[];
  selectedRecruitmentId?: number;
  onSelectRecruitment?: (id: number) => void;
  onOpenManager?: (mode: RecruitmentManagerMode) => void;
  isAdmin?: boolean;
}

export function SidebarHeaderComponent({
  recruitments: initialRecruitments,
  selectedRecruitmentId: controlledSelectedId,
  onSelectRecruitment,
  onOpenManager,
  isAdmin: isAdminProp,
}: SidebarHeaderProps) {
  const { isMobile } = useSidebar();
  const { user } = useAuth();

  const isAdmin = isAdminProp ?? user?.isAdmin ?? false;

  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const recruitments: RecruitmentOption[] = React.useMemo(() => {
    if (initialRecruitments !== undefined) {
      return [...initialRecruitments].sort((a, b) => b.year - a.year);
    }
    const currentYear = new Date().getFullYear();
    return [
      {
        id: -1,
        year: currentYear,
        semester: 1,
        title: "",
        active: true,
        start: "",
        end: "",
      },
      {
        id: -2,
        year: currentYear - 1,
        semester: 2,
        title: "",
        active: false,
        start: "",
        end: "",
      },
    ];
  }, [initialRecruitments]);

  const defaultId = React.useMemo(() => {
    const activeOne = recruitments.find((r) => r.active);
    return activeOne?.id ?? recruitments[0]?.id;
  }, [recruitments]);

  const [internalSelectedId, setInternalSelectedId] =
    React.useState<number>(defaultId);

  const selectedId = controlledSelectedId ?? internalSelectedId;

  const handleSelect = React.useCallback(
    (id: number) => {
      setInternalSelectedId(id);
      onSelectRecruitment?.(id);
      setIsOpen(false);
    },
    [onSelectRecruitment],
  );

  const activeRecruitment = React.useMemo(
    () => recruitments.find((r) => r.id === selectedId) ?? recruitments[0],
    [recruitments, selectedId],
  );

  const filteredRecruitments = React.useMemo(() => {
    if (!search.trim()) return recruitments;
    const query = search.toLowerCase().trim();
    return recruitments.filter((r) => {
      const yearMatch = r.year.toString().includes(query);
      const titleMatch = r.title.toLowerCase().includes(query);
      const semesterText = `${r.semester}º semestre`;
      return yearMatch || titleMatch || semesterText.includes(query);
    });
  }, [recruitments, search]);

  const isCurrentActive = activeRecruitment?.active ?? false;

  const headerTitle = activeRecruitment
    ? `Recrutamento ${activeRecruitment.year}`
    : "Recrutamento";
  const headerSubtitle = activeRecruitment
    ? `${activeRecruitment.semester}º Semestre`
    : "Período de recrutamento";
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
            {isAdmin && (
              <DropdownMenuGroup>
                <DropdownMenuLabel>Administração</DropdownMenuLabel>

                <DropdownMenuItem
                  onClick={() => {
                    setIsOpen(false);
                    onOpenManager?.("create");
                  }}
                >
                  <Avatar className="h-6 w-6 rounded-sm shrink-0 after:rounded-sm">
                    <AvatarFallback className="rounded-sm bg-primary/10 text-primary text-[10px] font-semibold">
                      <Plus className="h-3.5 w-3.5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-xs truncate">
                      Novo Recrutamento
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      Criar novo período de recrutamento
                    </span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setIsOpen(false);
                    onOpenManager?.("overview");
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
                      Editar, ativar ou eliminar existentes
                    </span>
                  </div>
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
                        const isSelected = r.id === selectedId;
                        const isRecruitmentActive = r.active;

                        return (
                          <DropdownMenuItem
                            key={r.id}
                            onClick={() => handleSelect(r.id)}
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
                                {isRecruitmentActive && (
                                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground truncate">
                                {r.semester}º Semestre
                              </span>
                            </div>

                            {isSelected && (
                              <Check className="size-3.5 text-primary shrink-0 mr-1" />
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
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
