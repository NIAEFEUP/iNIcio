"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { useSession } from "@/lib/use-session";
import { authClient } from "@/lib/auth-client";
import { cn, getInitials } from "@/lib/utils";
import { Button, buttonVariants } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { AccountSettingsModal } from "@/components/profile/account-settings-modal";
import NotificationPopup from "./notifications/notification-popup";
import { Notification } from "@/lib/db";

type Props = {
  className?: string;
  isAdmin: boolean;
  isRecruiter: boolean;
  showProgress?: boolean;
  hasResultsToShow?: boolean;
  notifications: Notification[];
};

export default function Navbar({
  className,
  isAdmin,
  isRecruiter,
  showProgress = false,
  hasResultsToShow = false,
  notifications,
}: Props) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const dashboardPrefixes = [
    "/admin",
    "/recruiter",
    "/calendar",
    "/candidates",
    "/dynamic",
  ];

  const isInDashboard = dashboardPrefixes.some((prefix) =>
    pathname?.startsWith(prefix),
  );

  const user = session?.user;
  const userInitials = getInitials(user?.name);

  const handleLogout = async () => {
    try {
      await authClient.signOut({});
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isInDashboard) {
    return null;
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all",
          isInDashboard &&
            "border-transparent bg-transparent backdrop-blur-none",
          className,
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left side: Brand + Nav Links */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-90"
              aria-label="Página Inicial"
            >
              <Image
                src="/inicio_logo_light.svg"
                alt="INICIO Logo"
                className="h-5 w-auto dark:hidden"
                width={88}
                height={20}
                priority
              />
              <Image
                src="/inicio_logo_dark.svg"
                alt="INICIO Logo"
                className="hidden h-5 w-auto dark:block"
                width={88}
                height={20}
                priority
              />
            </Link>

            <nav className="hidden md:flex md:items-center md:gap-1">
              {user && showProgress ? (
                <Link
                  href="/candidate/progress"
                  className={cn(
                    buttonVariants({
                      variant: pathname?.startsWith("/candidate/progress")
                        ? "secondary"
                        : "ghost",
                      size: "sm",
                    }),
                    "gap-1.5",
                  )}
                >
                  Progresso
                </Link>
              ) : null}

              {user && (isAdmin || isRecruiter) && (
                <Link
                  href={isAdmin ? "/admin" : "/recruiter/progress"}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      size: "sm",
                    }),
                    "gap-1.5",
                  )}
                >
                  <LayoutDashboard className="size-3.5" />
                  Painel
                </Link>
              )}
            </nav>
          </div>

          <div className="hidden md:flex md:items-center md:gap-3">
            {user ? (
              <>
                <NotificationPopup notifications={notifications} />

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-full p-1 text-sm transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                        aria-label="Menu do utilizador"
                      >
                        <Avatar className="size-8 ring-1 ring-border">
                          <AvatarImage
                            src={user.image || undefined}
                            alt={user.name || "User"}
                          />
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-56 p-1.5">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="p-2">
                        <div className="flex flex-col space-y-0.5">
                          <p className="text-sm font-medium leading-none text-foreground truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() => setIsProfileModalOpen(true)}
                        className="cursor-pointer"
                      >
                        <UserIcon className="size-4 mr-2" />
                        <span>Perfil</span>
                      </DropdownMenuItem>

                      {(isAdmin || isRecruiter) && (
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              isAdmin ? "/admin" : "/recruiter/progress",
                            )
                          }
                          className="cursor-pointer"
                        >
                          <LayoutDashboard className="size-4 mr-2" />
                          <span>Área de Recrutamento</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer">
                          {theme === "dark" ? (
                            <Moon className="size-4 mr-2" />
                          ) : theme === "light" ? (
                            <Sun className="size-4 mr-2" />
                          ) : (
                            <Monitor className="size-4 mr-2" />
                          )}
                          <span>Mudar Tema</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-36">
                          <DropdownMenuRadioGroup
                            value={theme}
                            onValueChange={(val) =>
                              setTheme(val as "light" | "dark" | "system")
                            }
                          >
                            <DropdownMenuRadioItem value="light">
                              <Sun className="size-3.5 mr-2" />
                              Claro
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="dark">
                              <Moon className="size-3.5 mr-2" />
                              Escuro
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="system">
                              <Monitor className="size-3.5 mr-2" />
                              Sistema
                            </DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={handleLogout}
                        className="cursor-pointer"
                      >
                        <LogOut className="size-4 mr-2" />
                        <span>Terminar Sessão</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    setTheme(
                      theme === "dark"
                        ? "light"
                        : theme === "light"
                          ? "system"
                          : "dark",
                    )
                  }
                  title="Alternar tema"
                  aria-label="Alternar tema"
                >
                  <Sun className="size-4 dark:hidden" />
                  <Moon className="size-4 hidden dark:inline" />
                </Button>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({
                      variant: "ghost",
                      size: "sm",
                    }),
                  )}
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({
                      variant: "default",
                      size: "sm",
                    }),
                  )}
                >
                  Criar Conta
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {user && <NotificationPopup notifications={notifications} />}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Abrir menu"
            >
              {isMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="bg-background px-4 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {user && showProgress ? (
                <Link
                  href="/candidate/progress"
                  className={cn(
                    buttonVariants({
                      variant: pathname?.startsWith("/candidate/progress")
                        ? "secondary"
                        : "ghost",
                    }),
                    "justify-start w-full gap-2",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Progresso
                </Link>
              ) : null}

              {user && (isAdmin || isRecruiter) && (
                <Link
                  href={isAdmin ? "/admin" : "/recruiter/progress"}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                    }),
                    "justify-start w-full gap-2",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard className="size-4 mr-2" />
                  Área de Recrutamento
                </Link>
              )}

              {user ? (
                <div className="mt-3 pt-3 flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    className="justify-start w-full"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                  >
                    <UserIcon className="size-4 mr-2" />
                    Perfil ({user.name})
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start w-full"
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                  >
                    {theme === "dark" ? (
                      <Sun className="size-4 mr-2" />
                    ) : (
                      <Moon className="size-4 mr-2" />
                    )}
                    Tema ({theme === "dark" ? "Escuro" : "Claro"})
                  </Button>
                  <Button
                    variant="destructive"
                    className="justify-start w-full"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="size-4 mr-2" />
                    Terminar Sessão
                  </Button>
                </div>
              ) : (
                <div className="mt-3 pt-3 flex flex-col gap-2">
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({
                        variant: "outline",
                      }),
                      "w-full",
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/signup"
                    className={cn(
                      buttonVariants({
                        variant: "default",
                      }),
                      "w-full",
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Criar Conta
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <AccountSettingsModal
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
      />
    </>
  );
}
