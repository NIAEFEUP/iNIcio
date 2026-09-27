"use client";

import { ExternalLink, Globe, Link2 } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { cn } from "@/lib/utils";

export interface CandidateLinksCardProps {
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  className?: string;
}

function formatHref(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function formatDisplayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

export function CandidateLinksCard({
  githubUrl,
  linkedinUrl,
  websiteUrl,
  className,
}: CandidateLinksCardProps) {
  if (!githubUrl && !linkedinUrl && !websiteUrl) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        <span>Links</span>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs space-y-3 text-xs">
        {githubUrl && (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
              <FaGithub className="size-3.5" />
              <span>GitHub</span>
            </span>
            <a
              href={formatHref(githubUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[65%] text-right inline-flex items-center gap-1"
              title={githubUrl}
            >
              <span className="truncate">{formatDisplayUrl(githubUrl)}</span>
              <ExternalLink className="size-3 shrink-0 opacity-60" />
            </a>
          </div>
        )}

        {linkedinUrl && (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
              <FaLinkedin className="size-3.5" />
              <span>LinkedIn</span>
            </span>
            <a
              href={formatHref(linkedinUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[65%] text-right inline-flex items-center gap-1"
              title={linkedinUrl}
            >
              <span className="truncate">{formatDisplayUrl(linkedinUrl)}</span>
              <ExternalLink className="size-3 shrink-0 opacity-60" />
            </a>
          </div>
        )}

        {websiteUrl && (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">
              <Globe className="size-3.5" />
              <span>Website</span>
            </span>
            <a
              href={formatHref(websiteUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[65%] text-right inline-flex items-center gap-1"
              title={websiteUrl}
            >
              <span className="truncate">{formatDisplayUrl(websiteUrl)}</span>
              <ExternalLink className="size-3 shrink-0 opacity-60" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidateLinksCard;
