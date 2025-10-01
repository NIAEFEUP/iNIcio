"use client";

import Link from "next/link";
import { useState } from "react";

import { Menu, X } from "lucide-react";
import LogoutButton from "./logout/logout-button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

import NotificationPopup from "./notifications/notification-popup";
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
  const { data: session } = authClient.useSession();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav
      className={cn(
        "mb-10 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 transition-opacity hover:opacity-80"
          >
            <img src="/logo.svg" alt="Logo" className="h-4 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {session && !isRecruiter && !isAdmin && !isCandidate && (
              <Link
                href="/application"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                Candidatar
              </Link>
            )}

            {session && (isRecruiter || isAdmin) && (
              <>
                <Link
                  href="/recruiter/availability"
                  className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground hover:underline underline-offset-4 decoration-2"
                >
                  Disponibilidades
                </Link>

                <Link
                  href="/alocacoes"
                  className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground hover:underline underline-offset-4 decoration-2"
                >
                  Alocações
                </Link>
                <Link
                  href="/candidates"
                  className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground hover:underline underline-offset-4 decoration-2"
                >
                  Candidatos
                </Link>
              </>
            )}

            {session && isCandidate && (
              <>
                <Link
                  href="/candidate/progress"
                  className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground hover:underline underline-offset-4 decoration-2"
                >
                  Progresso
                </Link>
                <Link
                  href="/agendamento"
                  className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground hover:underline underline-offset-4 decoration-2"
                >
                  Agendamento
                </Link>
              </>
            )}

            {!session ? (
              <div className="flex items-center space-x-4">
                <Button variant="default">
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="secondary">
                  <Link href="/signup">Registo</Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {session && isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    AdminUI
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Perfil
                </Link>

                <NotificationPopup notifications={notifications} />

                <LogoutButton />
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground/60 transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out md:hidden",
            isMenuOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0",
          )}
        >
          <div className="space-y-1 pt-2">
            <NotificationPopup notifications={notifications} />

            {session && (isRecruiter || isAdmin) && (
              <>
                <Link
                  href="/alocacoes"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Alocações
                </Link>
                <Link
                  href="/candidates"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Candidatos
                </Link>
              </>
            )}

            {session && isCandidate && (
              <>
                <Link
                  href="/candidate/progress"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Progresso
                </Link>
                <Link
                  href="/agendamento"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Agendamento
                </Link>
              </>
            )}

            {!session ? (
              <div className="space-y-1 pt-2">
                <Link
                  href="/login"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registo
                </Link>
              </div>
            ) : (
              <div className="space-y-1 pt-2">
                {session && isAdmin && (
                  <Link
                    href="/admin"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    AdminUI
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="block rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Perfil
                </Link>
                <div className="px-3 py-2">
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
