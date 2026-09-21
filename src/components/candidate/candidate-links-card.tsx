import { Network } from "lucide-react";
import { SocialLinks } from "@/components/profile/social-links";

interface CandidateLinksCardProps {
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
}

export function CandidateLinksCard({
  githubUrl,
  linkedinUrl,
  websiteUrl,
}: CandidateLinksCardProps) {
  if (!githubUrl && !linkedinUrl && !websiteUrl) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-xs">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Network className="size-3.5" />
        Links
      </span>
      <SocialLinks
        githubUrl={githubUrl ?? null}
        linkedinUrl={linkedinUrl ?? null}
        websiteUrl={websiteUrl ?? null}
      />
    </div>
  );
}
