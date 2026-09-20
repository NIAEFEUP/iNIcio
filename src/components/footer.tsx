"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { FaInstagram, FaGithub, FaLinkedin } from "react-icons/fa";
import { Mail, MapPin } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

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

  return (
    <footer className="w-full bg-background/50 pt-16 pb-12 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand & Mission */}
          <div className="space-y-2 max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-85"
            >
              <Image
                src="/logo.svg"
                alt="NIAEFEUP Logo"
                className="h-5 w-auto"
                width={36}
                height={36}
              />
              <span className="font-bold text-base tracking-tight text-foreground">
                NIAEFEUP
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Núcleo de Informática da Associação de Estudantes da Faculdade de
              Engenharia da Universidade do Porto. Um grupo de estudantes a
              desenvolver para estudantes.
            </p>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex flex-wrap gap-x-12 gap-y-6 text-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Recrutamento
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <Link
                    href="/"
                    className="hover:text-foreground transition-colors"
                  >
                    Início
                  </Link>
                </li>
                <li>
                  <Link
                    href="/application"
                    className="hover:text-foreground transition-colors"
                  >
                    Candidatura
                  </Link>
                </li>
                <li>
                  <Link
                    href="/candidate/progress"
                    className="hover:text-foreground transition-colors"
                  >
                    O meu Progresso
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Comunidade
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <a
                    href="https://niaefeup.pt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Website Oficial
                  </a>
                </li>
                <li>
                  <a
                    href="https://sinf.pt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    SINF
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/NIAEFEUP"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Projetos Open-Source
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Contacto
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <MapPin className="size-3 shrink-0" />
                  <span>Sala B315, FEUP</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Mail className="size-3 shrink-0" />
                  <a
                    href="mailto:recrutamento@ni.fe.up.pt"
                    className="hover:text-foreground transition-colors"
                  >
                    recrutamento@ni.fe.up.pt
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} NIAEFEUP. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/niaefeup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Instagram"
            >
              <FaInstagram className="size-4" />
            </a>
            <a
              href="https://github.com/NIAEFEUP"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <FaGithub className="size-4" />
            </a>
            <a
              href="https://linkedin.com/company/nifeup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <FaLinkedin className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
