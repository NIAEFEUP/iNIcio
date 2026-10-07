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
import { useDynamicData } from "@/lib/hooks/candidates/use-candidate-data";

interface CandidateDynamicModalProps {
  dynamicId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidateDynamicModal({
  dynamicId,
  open,
  onOpenChange,
}: CandidateDynamicModalProps) {
  const { data, isLoading } = useDynamicData(open && dynamicId ? dynamicId : 0);

  const dynamic = data?.dynamic;
  const content = dynamic?.content;
  const hasContent = content && Array.isArray(content) && content.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="sr-only">
          <DialogTitle>Notas da Dinâmica</DialogTitle>
          <DialogDescription>
            Notas do guião de dinâmica de grupo do candidato
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
            Sem notas de dinâmica registadas.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
