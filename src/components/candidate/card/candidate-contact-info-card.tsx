"use client";

import { Contact, Mail, Phone } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CandidateContactInfoCardProps {
  email?: string | null;
  phone?: string | null;
  className?: string;
}

export function CandidateContactInfoCard({
  email,
  phone,
  className,
}: CandidateContactInfoCardProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        <span>Contactos</span>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-muted-foreground shrink-0">
            <Mail className="size-4" />
            <span>Email</span>
          </span>
          {email ? (
            <a
              href={`mailto:${email}`}
              className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[70%] text-right"
              title={email}
            >
              {email}
            </a>
          ) : (
            <span className="text-muted-foreground italic">—</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-muted-foreground shrink-0">
            <Phone className="size-4" />
            <span>Telefone</span>
          </span>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="font-medium text-foreground hover:text-primary transition-colors text-right"
            >
              {phone}
            </a>
          ) : (
            <span className="text-muted-foreground italic">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default CandidateContactInfoCard;
