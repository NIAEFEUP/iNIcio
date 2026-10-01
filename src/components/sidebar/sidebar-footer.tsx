import {
  ChevronsUpDown,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Settings,
  Sun,
} from "lucide-react";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";
import { type User as UserType, useAuth } from "@/hooks/use-auth";
import { useDeviceSessions } from "@/hooks/use-device-sessions";
import { useSession } from "@/lib/use-session";
import { useSignedProfilePictureUrl } from "@/hooks/use-signed-profile-picture-url";
import { cn, getInitials } from "@/lib/utils";
import { AccountSettingsModal } from "@/components/profile/account-settings-modal";

function canAccessRoute(role: string, pathname: string) {
  if (pathname.startsWith("/admin")) return role === "admin";
  if (
    pathname.startsWith("/recruiter") ||
    pathname.startsWith("/candidates") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/dynamic")
  )
    return role === "admin" || role === "recruiter";
  return true;
}

function getMacSnapshot() {
  const platform =
    // SAFETY: navigator.userAgentData is not typed in all TS DOM targets yet.
    (
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

export interface SidebarFooterProps {
  user?: UserType | null;
  isAuthenticated?: boolean;
  onLogout?: () => Promise<void>;
}

export function SidebarFooterComponent({
  user: propUser,
  isAuthenticated: propIsAuthenticated,
  onLogout,
}: SidebarFooterProps = {}) {
  const { isMobile } = useSidebar();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMac = useIsMac();
  const { theme, setTheme } = useTheme();

  const [isOpen, setIsOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);

  const user = propUser !== undefined ? propUser : auth.user;
  const isAuthenticated =
    propIsAuthenticated !== undefined
      ? propIsAuthenticated
      : auth.isAuthenticated;

  const { data: sessionData } = useSession();
  const { sessions, switchAccount, revokeAccount } = useDeviceSessions();

  const [signedImageUrl] = useSignedProfilePictureUrl(user?.image);

  const otherSessions = React.useMemo(
    () => sessions.filter((s) => s.user.id !== user?.id),
    [sessions, user?.id],
  );

  const handleSwitchAccount = React.useCallback(
    async (sessionToken: string, role: string) => {
      setIsOpen(false);
      try {
        await switchAccount(sessionToken);
        router.refresh();
        if (!canAccessRoute(role, pathname)) {
          router.push("/");
        }
      } catch (err) {
        toast.add({
          type: "error",
          title: "Could not switch account",
          description:
            err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    },
    [switchAccount, router, pathname],
  );

  const handleAddAccount = React.useCallback(() => {
    setIsOpen(false);
    router.push(`/login?addAccount=1&from=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  const handleLogoutCurrent = React.useCallback(async () => {
    setIsOpen(false);
    try {
      if (onLogout) {
        await onLogout();
      } else if (sessionData?.session?.token) {
        await revokeAccount(sessionData.session.token);
        router.refresh();
      } else {
        await auth.logout();
        router.push("/login");
      }
    } catch (err) {
      toast.add({
        type: "error",
        title: "Could not sign out",
        description:
          err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }, [onLogout, sessionData, revokeAccount, auth, router]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        !event.altKey &&
        (event.key.toLowerCase() === "q" || event.key === "Q")
      ) {
        if (isAuthenticated && user) {
          event.preventDefault();
          handleLogoutCurrent();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated, user, handleLogoutCurrent]);

  if (!isAuthenticated || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            render={<Link href="/login" />}
            tooltip="Iniciar sessão"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                <LogIn className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Iniciar sessão</span>
              <span className="truncate text-xs text-muted-foreground">
                Acede à tua conta
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const userInitials = getInitials(user.name, "U");

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
                    <AvatarImage
                      src={signedImageUrl || undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 opacity-50" />
                </SidebarMenuButton>
              }
            />
            <DropdownMenuContent
              className="w-80 p-0 rounded-2xl overflow-hidden shadow-lg border border-border"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={8}
            >
              {/* Active Account Section */}
              <div className="flex flex-col items-center text-center p-5 bg-muted/20">
                <Avatar className="size-16 rounded-full ring-2 ring-background shadow-xs mb-3">
                  <AvatarImage
                    src={signedImageUrl || undefined}
                    alt={user.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>

                <span className="font-semibold text-sm truncate text-foreground max-w-full">
                  {user.name}
                </span>

                <span className="text-xs text-muted-foreground truncate max-w-full mt-0.5">
                  {user.email}
                </span>
              </div>

              {/* Other Accounts Section */}
              {otherSessions.length > 0 && (
                <div className="border-t border-border/50 py-1">
                  <div className="px-3 pt-1 pb-0.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Outras contas
                  </div>
                  <DropdownMenuGroup className="flex flex-col px-1">
                    {otherSessions.map((deviceSession) => {
                      const initials = getInitials(
                        deviceSession.user.name,
                        "U",
                      );
                      return (
                        <DropdownMenuItem
                          key={deviceSession.session.token}
                          onClick={() =>
                            handleSwitchAccount(
                              deviceSession.session.token,
                              deviceSession.user.role,
                            )
                          }
                          className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer"
                        >
                          <Avatar className="size-8 rounded-full shrink-0">
                            <AvatarImage
                              src={deviceSession.user.image ?? undefined}
                              alt={deviceSession.user.name}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium text-xs truncate text-foreground">
                              {deviceSession.user.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {deviceSession.user.email}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                </div>
              )}

              {/* Menu Actions: Settings & Add Account */}
              <div className="border-t border-border/50 p-1">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer"
                  >
                    <div className="size-8 rounded-full border border-border flex items-center justify-center shrink-0 text-muted-foreground bg-muted/40">
                      <Settings className="size-4" />
                    </div>
                    <span className="font-medium text-xs">
                      Definições de perfil
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleAddAccount}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer"
                  >
                    <div className="size-8 rounded-full border border-dashed border-border flex items-center justify-center shrink-0 text-muted-foreground">
                      <Plus className="size-4" />
                    </div>
                    <span className="font-medium text-xs">
                      Adicionar outra conta
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </div>

              {/* Footer: Theme toggle & Sign out */}
              <div className="border-t border-border/50 p-2 bg-muted/20 flex items-center justify-between gap-2">
                {/* 3-icon Theme Switcher */}
                <div className="flex items-center bg-muted/60 p-0.5 rounded-md border border-border/40">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={cn(
                      "p-1.5 rounded-sm transition-colors cursor-pointer",
                      theme === "light"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Claro"
                    aria-label="Tema claro"
                  >
                    <Sun className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "p-1.5 rounded-sm transition-colors cursor-pointer",
                      theme === "dark"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Escuro"
                    aria-label="Tema escuro"
                  >
                    <Moon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={cn(
                      "p-1.5 rounded-sm transition-colors cursor-pointer",
                      theme === "system"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Sistema"
                    aria-label="Tema do sistema"
                  >
                    <Monitor className="size-3.5" />
                  </button>
                </div>

                {/* Sign Out Action */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLogoutCurrent}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer h-7 px-2"
                  title={
                    isMac
                      ? "Terminar sessão (⇧⌘Q)"
                      : "Terminar sessão (Ctrl+Shift+Q)"
                  }
                >
                  <LogOut className="size-3.5 mr-1" />
                  Terminar sessão
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AccountSettingsModal
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
    </>
  );
}
