"use client";

import * as React from "react";
import { Loader2, Mail } from "lucide-react";

import { getCandidateEmails } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";

interface SendCandidatesEmailButtonProps {
  currentRecruitmentId?: number;
}

export function SendCandidatesEmailButton({
  currentRecruitmentId,
}: SendCandidatesEmailButtonProps) {
  const { state, isMobile } = useSidebar();
  const [isSending, setIsSending] = React.useState(false);

  const handleSendEmail = React.useCallback(async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      const emails = await getCandidateEmails(currentRecruitmentId);
      if (!emails || emails.length === 0) {
        toast.add({
          type: "info",
          title: "Nenhum candidato encontrado",
          description:
            "Não existem candidatos neste recrutamento para enviar email.",
        });
        return;
      }

      const bccList = encodeURIComponent(emails.join(","));
      const mailtoLink = `mailto:?bcc=${bccList}`;
      window.location.href = mailtoLink;
    } catch (err) {
      console.error(err);
      toast.add({
        type: "error",
        title: "Erro ao preparar email",
        description:
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao obter os contactos dos candidatos.",
      });
    } finally {
      setIsSending(false);
    }
  }, [isSending, currentRecruitmentId]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="default"
            onClick={handleSendEmail}
            disabled={isSending}
            className="w-full gap-2 font-medium cursor-pointer shadow-sm group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin shrink-0" />
            ) : (
              <Mail className="size-4 shrink-0" />
            )}
            <span className="truncate group-data-[collapsible=icon]:hidden">
              Enviar emails
            </span>
          </Button>
        }
      />
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
      >
        Enviar email aos candidatos
      </TooltipContent>
    </Tooltip>
  );
}
