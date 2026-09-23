import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import RealTimeEditor from "@/components/editor/real-time-editor";
import { toast } from "@/components/ui/toast";
import { getStableImageUrl } from "@/lib/stable-image-url";
import { getInitials } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { useRef, useState } from "react";
import type { BlockNoteEditor } from "@blocknote/core";

import { ReadOnlyBlocks } from "../editor/read-only-blocks";
import { Comment } from "../candidate/page/candidate-comments";
import { CandidateWithMetadata } from "@/lib/candidate";
import { User } from "@/lib/db";

interface CommentDisplayProps {
  candidate: CandidateWithMetadata | Array<CandidateWithMetadata>;
  comment: Comment;
  currentUserId?: string;
  onSaveEdit?: (commentId: number, content: Array<any>) => Promise<boolean>;
  recruiters?: Array<User>;
}

export function CommentDisplay({
  candidate,
  comment,
  currentUserId,
  onSaveEdit,
  recruiters = [],
}: CommentDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Hold the editor in a ref so a stale instance from a previous edit
  // session can never be used to save
  const editEditorRef = useRef<BlockNoteEditor | null>(null);

  const authorCandidateFriend = Array.isArray(candidate)
    ? candidate.filter((c) =>
        c.knownRecruiters?.find((r) => r.recruiterId === comment.user?.id),
      ).length > 0
    : candidate?.knownRecruiters?.find(
        (r) => r.recruiterId === comment.user?.id,
      );

  const canEdit = Boolean(
    onSaveEdit &&
    currentUserId &&
    comment.comment &&
    // Optimistic comments have no id until the save resolves; editing
    // them would send an undefined id to the server
    comment.comment.id != null &&
    comment.comment.authorId === currentUserId,
  );

  const closeEditor = () => {
    editEditorRef.current = null;
    setIsEditing(false);
  };

  const startEditing = () => {
    editEditorRef.current = null;
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!comment.comment || !onSaveEdit) return;

    const content = editEditorRef.current?.document;
    // No captured editor (untouched or empty document) or cleared content:
    // nothing to save, close silently
    if (!content || content.length === 0) {
      closeEditor();
      return;
    }

    setIsSaving(true);
    try {
      const ok = await onSaveEdit(comment.comment.id, content);
      if (ok) {
        closeEditor();
      } else {
        toast.add({
          type: "error",
          title: "Não foi possível editar o comentário.",
        });
      }
    } catch {
      toast.add({
        type: "error",
        title: "Não foi possível editar o comentário.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs transition-colors">
      <div className="flex items-start gap-3">
        <Avatar size="lg" className="ring-2 ring-border/60">
          <AvatarImage
            src={getStableImageUrl(comment.user?.image) || undefined}
            alt={comment.user?.name}
          />
          <AvatarFallback>
            <InitialsAvatar
              className="size-full rounded-full text-sm font-bold"
              initials={getInitials(comment.user?.name)}
            />
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold text-foreground">
              {comment.user?.name}
            </p>
            {authorCandidateFriend && (
              <Badge variant="secondary" className="h-5 text-xs">
                Conhece a pessoa
              </Badge>
            )}
            <span className="ml-auto flex items-center gap-2">
              {canEdit && !isEditing && (
                <button
                  type="button"
                  aria-label="Editar comentário"
                  onClick={startEditing}
                  className="text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
              {comment.comment?.createdAt && (
                <time className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(comment.comment.createdAt).toLocaleDateString(
                    "pt-BR",
                    {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </time>
              )}
              {comment.comment?.editedAt && (
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  (editado)
                </span>
              )}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <RealTimeEditor
                entity={{ content: comment.comment?.content }}
                mentionItems={recruiters}
                onChange={(editor) => {
                  editEditorRef.current = editor;
                }}
                collab={false}
                boxed={false}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeEditor}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-foreground">
              <ReadOnlyBlocks blocks={comment.comment.content as Array<any>} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
