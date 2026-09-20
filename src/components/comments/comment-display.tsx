import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InitialsAvatar } from "@/components/common/initials-avatar";
import { getInitials } from "@/lib/utils";

import { ReadOnlyBlocks } from "../editor/read-only-blocks";
import { Comment } from "../candidate/page/candidate-comments";
import { CandidateWithMetadata } from "@/lib/candidate";

interface CommentDisplayProps {
  candidate: CandidateWithMetadata | Array<CandidateWithMetadata>;
  comment: Comment;
}

export function CommentDisplay({ candidate, comment }: CommentDisplayProps) {
  const authorCandidateFriend = Array.isArray(candidate)
    ? candidate.filter((c) =>
        c.knownRecruiters?.find((r) => r.recruiterId === comment.user?.id),
      ).length > 0
    : candidate?.knownRecruiters?.find(
        (r) => r.recruiterId === comment.user?.id,
      );

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs transition-colors">
      <div className="flex items-start gap-3">
        <Avatar size="lg" className="ring-2 ring-border/60">
          <AvatarImage
            src={comment.user?.image || undefined}
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
            {comment.comment.createdAt && (
              <time className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
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
          </div>

          <div className="text-sm text-foreground">
            <ReadOnlyBlocks blocks={comment.comment.content as Array<any>} />
          </div>
        </div>
      </div>
    </div>
  );
}
