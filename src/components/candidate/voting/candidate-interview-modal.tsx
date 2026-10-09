"use client";

import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReadOnlyBlocks } from "@/components/editor/read-only-blocks";
import { useInterviewData } from "@/lib/hooks/candidates/use-candidate-data";

interface CandidateInterviewModalProps {
  candidateId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidateInterviewModal({
  candidateId,
  open,
  onOpenChange,
}: CandidateInterviewModalProps) {
  const { data, isLoading } = useInterviewData(
    open && candidateId ? candidateId : "",
  );

  const content = data?.interview?.content;
  const hasContent = content && Array.isArray(content) && content.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[95vw] h-[80vh] max-h-[85vh] flex flex-col p-6 sm:p-8 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Notas de Entrevista</DialogTitle>
          <DialogDescription>
            Notas do guião de entrevista do candidato
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full w-full">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasContent ? (
            <div className="w-full">
              <ReadOnlyBlocks blocks={content as any[]} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full w-full py-16 text-center text-sm text-muted-foreground">
              Sem notas de entrevista registadas.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
