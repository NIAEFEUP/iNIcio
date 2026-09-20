"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Mail, MapPin } from "lucide-react";
import { FaGithub, FaInstagram, FaLinkedin } from "react-icons/fa";
import { Button } from "@/components/ui/button";

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

  const socials = [
    {
      name: "Instagram",
      url: "https://instagram.com/niaefeup",
      icon: <FaInstagram className="size-4" />,
    },
    {
      name: "LinkedIn",
      url: "https://linkedin.com/company/nifeup",
      icon: <FaLinkedin className="size-4" />,
    },
    {
      name: "GitHub",
      url: "https://github.com/niaefeup",
      icon: <FaGithub className="size-4" />,
    },
  ];

  return (
    <footer className="w-full bg-background/50 border-t border-border/60 pt-14 pb-10 mt-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="space-y-4 max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-85"
            >
              <Image
                src="/ni_logo_light.svg"
                alt="NI Logo"
                width={36}
                height={36}
                className="dark:hidden"
              />
              <Image
                src="/ni_logo_dark.svg"
                alt="NI Logo"
                width={36}
                height={36}
                className="hidden dark:block"
              />
              <span className="text-lg font-bold tracking-tight text-foreground">
                NIAEFEUP
              </span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Núcleo de Informática da Faculdade de Engenharia da Universidade
              do Porto.
            </p>

            <div className="flex items-center gap-2">
              {socials.map((social) => (
                <Button
                  key={social.name}
                  variant="outline"
                  size="icon"
                  nativeButton={false}
                  className="size-8 text-muted-foreground hover:text-foreground"
                  render={
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                    />
                  }
                >
                  {social.icon}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Contacto
            </p>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 shrink-0" />
                <span>Sala B315, FEUP</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0" />
                <a
                  href="mailto:ni@aefeup.pt"
                  className="hover:text-foreground transition-colors"
                >
                  ni@aefeup.pt
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Links
            </p>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
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
                  href="/privacy-policy"
                  className="hover:text-foreground transition-colors"
                >
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} NIAEFEUP. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
