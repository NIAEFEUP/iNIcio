import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    <div className="group bg-card border border-border rounded-xl p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex flex-col md:flex-row items-start items-center justify-center mx-auto gap-6 md:gap-0">
        <div className="flex flex-col justify-center items-center">
          <Avatar className="w-10 h-10 ring-2 ring-border transition-all group-hover:ring-primary/30">
            <AvatarImage
              src={comment.user?.image || "/placeholder.svg"}
              alt={comment.user?.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-muted to-muted/60 text-muted-foreground font-semibold">
              {comment?.user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-medium text-foreground flex flex-col gap-1 justify-center items-center">
            <span>{comment.user?.name}</span>
            {authorCandidateFriend && (
              <span className="italic text-muted-foreground">
                Conheçe a pessoa
              </span>
            )}
          </p>
          <p className="text-sm flex flex-row gap-1">
            {comment.comment.createdAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(comment.comment.createdAt).toLocaleDateString(
                  "pt-BR",
                  {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </span>
            )}
          </p>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <ReadOnlyBlocks blocks={comment.comment.content as Array<any>} />
          </div>
        </div>
      </div>
    </div>
  );
}
