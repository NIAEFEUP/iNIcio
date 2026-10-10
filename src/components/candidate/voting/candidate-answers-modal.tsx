"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { applicationAnswers } from "@/lib/candidate-answers";
import type { CandidateApplicationSummary } from "@/lib/candidate";

/** Read-only view of a candidate's application answers. */
export function CandidateAnswersModal({
  candidateName,
  application,
  open,
  onOpenChange,
}: {
  candidateName: string;
  application: CandidateApplicationSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Respostas · {candidateName}</DialogTitle>
          <DialogDescription>
            Respostas do formulário de candidatura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {applicationAnswers.map((answer) => {
            const content = application?.[answer.attribute] as
              string | null | undefined;
            return (
              <div key={answer.attribute} className="space-y-1">
                <div className="text-sm font-semibold text-foreground">
                  {answer.title}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {content || "Sem resposta."}
                </p>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
