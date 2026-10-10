"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { ReadOnlyBlocks } from "@/components/editor/read-only-blocks";
import { useApplicationComments } from "@/lib/hooks/candidates/use-candidate-data";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { getInitials } from "@/lib/utils";

/** Read-only list of the candidate's application comments. */
export function CandidateCommentsModal({
  candidateId,
  candidateName,
  open,
  onOpenChange,
}: {
  candidateId: string;
  candidateName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Passing an empty id when closed makes the SWR key null (no fetch).
  const { data: comments, isLoading } = useApplicationComments(
    open ? candidateId : "",
  );
  const list = comments ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comentários · {candidateName}</DialogTitle>
          <DialogDescription>
            Comentários deixados por recrutadores sobre este candidato.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sem comentários.
          </p>
        ) : (
          <div className="space-y-3">
            {list.map((comment, index) => (
              <div
                key={comment.comment?.id ?? index}
                className="space-y-2 rounded-lg border border-border/70 bg-card p-3"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarImage
                      src={getStableImageUrl(comment.user?.image)}
                      alt={comment.user?.name ?? ""}
                    />
                    <AvatarFallback className="text-[9px]">
                      {getInitials(comment.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">
                    {comment.user?.name ?? "Desconhecido"}
                  </span>
                </div>
                {Array.isArray(comment.comment?.content) &&
                comment.comment.content.length > 0 ? (
                  <ReadOnlyBlocks blocks={comment.comment.content as any[]} />
                ) : (
                  <p className="text-sm text-muted-foreground">Sem conteúdo.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
