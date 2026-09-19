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
  Sparkles,
  ClipboardList,
} from "lucide-react";

import { useSession } from "@/lib/use-session";
import { authClient } from "@/lib/auth-client";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import NotificationPopup from "./notifications/notification-popup";
import { ThemeToggle } from "./theme-toggle";
import { Notification } from "@/lib/db";

type Props = {
  className?: string;
  isAdmin: boolean;
  isRecruiter: boolean;
  isCandidate: boolean;
  notifications: Notification[];
};

export default function Navbar({
  className,
  isAdmin,
  isRecruiter,
  isCandidate,
  notifications,
}: Props) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dashboardPrefixes = [
    "/admin",
    "/recruiter",
    "/calendar",
    "/candidates",
    "/dynamic",
  ];

  const candidateCountdownPrefixes = [
    "/candidate/progress",
    "/candidate/result",
    "/candidate/interview",
    "/candidate/dynamic",
  ];

  const isDashboardRoute =
    dashboardPrefixes.some((prefix) => pathname?.startsWith(prefix)) ||
    (pathname?.startsWith("/candidate/") &&
      !candidateCountdownPrefixes.some((prefix) =>
        pathname.startsWith(prefix),
      ));

  if (isDashboardRoute) {
    return null;
  }

  const handleLogout = async () => {
    await authClient.signOut({});
    router.push("/");
    router.refresh();
  };

  const user = session?.user;
  const userInitials = getInitials(user?.name, "U");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-colors",
        className,
      )}
    >
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
          >
            <Image
              src="/logo.svg"
              alt="NIAEFEUP Logo"
              className="h-5 w-auto"
              width={40}
              height={40}
              priority
            />
            <span className="font-semibold text-base tracking-tight text-foreground">
              iNIcio
            </span>
          </Link>

          {/* Desktop Candidate Navigation Links */}
          <nav className="hidden md:flex md:items-center md:gap-1">
            <Button
              variant={pathname === "/" ? "secondary" : "ghost"}
              size="sm"
              render={<Link href="/" />}
            >
              Início
            </Button>

            {user && isCandidate && (
              <>
                <Button
                  variant={
                    pathname?.startsWith("/candidate/progress")
                      ? "secondary"
                      : "ghost"
                  }
                  size="sm"
                  render={<Link href="/candidate/progress" />}
                >
                  <ClipboardList className="size-4" />
                  Progresso
                </Button>
                <Button
                  variant={
                    pathname?.startsWith("/candidate/result")
                      ? "secondary"
                      : "ghost"
                  }
                  size="sm"
                  render={<Link href="/candidate/result" />}
                >
                  <Sparkles className="size-4" />
                  Resultado
                </Button>
              </>
            )}

            {user && !isRecruiter && !isAdmin && !isCandidate && (
              <Button
                variant={pathname === "/application" ? "secondary" : "ghost"}
                size="sm"
                render={<Link href="/application" />}
              >
                Candidatura
              </Button>
            )}

            {user && (isAdmin || isRecruiter) && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link href={isAdmin ? "/admin" : "/recruiter/progress"} />
                }
              >
                <LayoutDashboard className="size-3.5" />
                Painel
              </Button>
            )}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="hidden md:flex md:items-center md:gap-3">
          <ThemeToggle />

          {user ? (
            <>
              <NotificationPopup notifications={notifications} />

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="flex items-center gap-2 rounded-full p-1 text-sm transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer"
                  >
                    <UserIcon className="size-4 mr-2" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  {isCandidate && (
                    <DropdownMenuItem
                      onClick={() => router.push("/candidate/progress")}
                      className="cursor-pointer"
                    >
                      <ClipboardList className="size-4 mr-2" />
                      <span>O meu Progresso</span>
                    </DropdownMenuItem>
                  )}
                  {(isAdmin || isRecruiter) && (
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(isAdmin ? "/admin" : "/recruiter/progress")
                      }
                      className="cursor-pointer"
                    >
                      <LayoutDashboard className="size-4 mr-2" />
                      <span>Área de Recrutamento</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="size-4 mr-2" />
                    <span>Terminar Sessão</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Entrar
              </Button>
              <Button
                variant="default"
                size="sm"
                render={<Link href="/signup" />}
              >
                Criar Conta
              </Button>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
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

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div className="border-b border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Button
              variant={pathname === "/" ? "secondary" : "ghost"}
              className="justify-start w-full"
              render={<Link href="/" />}
              onClick={() => setIsMenuOpen(false)}
            >
              Início
            </Button>

            {user && isCandidate && (
              <>
                <Button
                  variant={
                    pathname?.startsWith("/candidate/progress")
                      ? "secondary"
                      : "ghost"
                  }
                  className="justify-start w-full"
                  render={<Link href="/candidate/progress" />}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ClipboardList className="size-4 mr-2" />
                  Progresso
                </Button>
                <Button
                  variant={
                    pathname?.startsWith("/candidate/result")
                      ? "secondary"
                      : "ghost"
                  }
                  className="justify-start w-full"
                  render={<Link href="/candidate/result" />}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Sparkles className="size-4 mr-2" />
                  Resultado
                </Button>
              </>
            )}

            {user && !isRecruiter && !isAdmin && !isCandidate && (
              <Button
                variant={pathname === "/application" ? "secondary" : "ghost"}
                className="justify-start w-full"
                render={<Link href="/application" />}
                onClick={() => setIsMenuOpen(false)}
              >
                Candidatura
              </Button>
            )}

            {user && (isAdmin || isRecruiter) && (
              <Button
                variant="outline"
                className="justify-start w-full"
                render={
                  <Link href={isAdmin ? "/admin" : "/recruiter/progress"} />
                }
                onClick={() => setIsMenuOpen(false)}
              >
                <LayoutDashboard className="size-4 mr-2" />
                Área de Recrutamento
              </Button>
            )}

            {user ? (
              <div className="mt-3 border-t border-border pt-3 flex flex-col gap-2">
                <Button
                  variant="ghost"
                  className="justify-start w-full"
                  render={<Link href="/profile" />}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserIcon className="size-4 mr-2" />
                  Perfil ({user.name})
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
              <div className="mt-3 border-t border-border pt-3 flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  render={<Link href="/login" />}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Entrar
                </Button>
                <Button
                  variant="default"
                  className="w-full"
                  render={<Link href="/signup" />}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Criar Conta
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
