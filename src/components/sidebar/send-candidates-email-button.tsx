"use client";

import * as React from "react";
import { Mail } from "lucide-react";

import { EmailComposerDialogContent } from "@/components/email/email-composer-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SendCandidatesEmailButtonProps {
  currentRecruitmentId?: number;
}

export function SendCandidatesEmailButton({
  currentRecruitmentId,
}: SendCandidatesEmailButtonProps) {
  const { state, isMobile } = useSidebar();
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button
                  type="button"
                  variant="default"
                  className="w-full gap-2 font-medium cursor-pointer shadow-sm group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
                >
                  <Mail className="size-4 shrink-0" />
                  <span className="truncate group-data-[collapsible=icon]:hidden">
                    Enviar emails
                  </span>
                </Button>
              }
            />
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

      {open && (
        <EmailComposerDialogContent recruitmentId={currentRecruitmentId} />
      )}
    </Dialog>
  );
}
