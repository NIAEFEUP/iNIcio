"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2 max-w-sm">
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
            </Link>
            <p className="hover:text-foreground text-muted-foreground transition-colors">
              © {new Date().getFullYear()} NIAEFEUP. Todos os direitos
              reservados.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-6 text-sm">
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
                    href="mailto:ni@aefeup.pt"
                    className="hover:text-foreground transition-colors"
                  >
                    ni@aefeup.pt
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
