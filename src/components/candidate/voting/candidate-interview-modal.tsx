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
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="sr-only">
          <DialogTitle>Notas de Entrevista</DialogTitle>
          <DialogDescription>
            Notas do guião de entrevista do candidato
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : hasContent ? (
          <div className="w-full">
            <ReadOnlyBlocks blocks={content as any[]} />
          </div>
        ) : (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Sem notas de entrevista registadas.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
