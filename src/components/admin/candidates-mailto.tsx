"use client";

import { Button } from "@/components/ui/button";

interface CandidatesMailtoProps {
  emails: Array<string>;
}

export default function CandidatesMailto({ emails }: CandidatesMailtoProps) {
  const mailTo = () => {
    const bccList = encodeURIComponent(emails.join(","));
    const mailtoLink = `mailto:?bcc=${bccList}`;

    window.location.href = mailtoLink;
  };

  return (
    <Button variant="secondary" onClick={mailTo}>
      Enviar email aos candidatos
    </Button>
  );
}
