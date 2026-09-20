"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReadOnlyBlocks } from "@/components/editor/read-only-blocks";
import type { CandidateRecruitmentResult } from "@/lib/final-messages";

interface CandidateResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: CandidateRecruitmentResult | null;
}

export function CandidateResultModal({
  open,
  onOpenChange,
  result,
}: CandidateResultModalProps) {
  if (!result) return null;

  const isApproved = result.decision === "approved";
  const isRejected = result.decision === "rejected";
  const content = result.content;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="flex flex-col items-center text-center space-y-3 pb-2">
          {isApproved ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="size-3.5" />
              {result.recruitmentTitle} · Admitido(a)
            </div>
          ) : isRejected ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
              <XCircle className="size-3.5" />
              {result.recruitmentTitle} · Decisão Final
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <Clock className="size-3.5" />
              {result.recruitmentTitle} · Em Deliberação
            </div>
          )}

          <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight text-foreground text-center">
            {isApproved
              ? "Foste aceite no NIAEFEUP!"
              : isRejected
                ? "Obrigado pelo teu interesse e dedicação."
                : "A tua candidatura está em avaliação."}
          </DialogTitle>

          <DialogDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed text-center">
            {isApproved
              ? "Bem-vindo/a à equipa! Estamos muito entusiasmados por começares a trabalhar connosco. Nos próximos dias entraremos em contacto por email com todos os detalhes sobre a tua integração e o arranque nos projetos."
              : isRejected
                ? "Infelizmente, devido ao número limitado de vagas neste ciclo, não foi possível selecionar a tua candidatura. Queremos agradecer sinceramente todo o teu tempo e encorajar-te a participar nos eventos, conferências e futuros recrutamentos do NIAEFEUP."
                : "A equipa de recrutamento está a concluir a análise de todas as etapas. Assim que o resultado for publicado, terás acesso aqui e serás notificado por email."}
          </DialogDescription>
        </DialogHeader>

        {content && content.length > 0 && (
          <div className="text-left text-sm text-foreground bg-muted/20 border border-border/60 rounded-2xl p-5 sm:p-6 w-full mt-2">
            <ReadOnlyBlocks blocks={content as any} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
