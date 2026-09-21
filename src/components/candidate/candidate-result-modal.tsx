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
        <DialogHeader className="flex flex-col items-center space-y-3 pb-2">
          <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {isApproved
              ? "Foste aceite no NIAEFEUP!"
              : isRejected
                ? "Obrigado pelo teu interesse e dedicação."
                : "A tua candidatura está em avaliação."}
          </DialogTitle>

          <DialogDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {isApproved ? (
              "Bem-vindo/a à equipa! Estamos muito entusiasmados por começares a trabalhar connosco. Nos próximos dias entraremos em contacto por email com todos os detalhes sobre a tua integração e o arranque nos projetos."
            ) : isRejected ? (
              <>
                <span>
                  Antes de mais agradecemos o teu interesse no Núcleo de
                  Informática e pelo tempo que disponibilizaste nesta fase de
                  recrutamento.
                </span>
                <br />
                <br />
                <span>
                  Após discussão interna e análise tanto da tua entrevista,
                  dinâmica de grupo e candidatura, vimos, infelizmente,
                  informar-te de que não iremos avançar com o processo.
                </span>
                <br />
                <br />
                <span>Obrigado pelo teu interesse.</span>
              </>
            ) : (
              "A equipa de recrutamento está a concluir a análise de todas as etapas. Assim que o resultado for publicado, terás acesso aqui e serás notificado por email."
            )}
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
