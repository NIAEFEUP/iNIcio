import { Button } from "@/components/ui/button";
import { Github, Linkedin, Globe } from "lucide-react";

interface SocialLink {
  name: string;
  url: string;
  icon: React.ReactNode;
}

interface SocialLinksProps {
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
}

export function SocialLinks({
  githubUrl,
  linkedinUrl,
  websiteUrl,
}: SocialLinksProps) {
  const socials: SocialLink[] = [
    { name: "GitHub", url: githubUrl, icon: <Github className="h-4 w-4" /> },
    {
      name: "LinkedIn",
      url: linkedinUrl,
      icon: <Linkedin className="h-4 w-4" />,
    },
    { name: "Website", url: websiteUrl, icon: <Globe className="h-4 w-4" /> },
  ];

  return (
    <div className="flex gap-2">
      {socials
        .filter((social) => social.url)
        .map((social) => (
          <Button key={social.name} variant="outline" size="icon" asChild>
            <a
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.name}
            >
              {social.icon}
            </a>
          </Button>
        ))}
    </div>
  );
}
