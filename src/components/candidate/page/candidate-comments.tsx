"use client";

import { CommentDisplay } from "@/components/comments/comment-display";
import RealTimeEditor from "@/components/editor/real-time-editor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { useSession } from "@/lib/use-session";
import {
  ApplicationComment,
  DynamicComment,
  InterviewComment,
  User,
} from "@/lib/db";
import { Send } from "lucide-react";
import { useState } from "react";

import { commentCreationMap } from "@/lib/comment-format";
import { CandidateWithMetadata } from "@/lib/candidate";

type CommentType = "application" | "interview" | "dynamic";

export type Comment = {
  user: User | null;
  comment: ApplicationComment | InterviewComment | DynamicComment | null;
  type: CommentType;
};

interface CandidateCommentsProps {
  candidate: CandidateWithMetadata | Array<CandidateWithMetadata>;
  type: CommentType;
  comments: Array<Comment>;
  saveToDatabase: (content: Array<any>) => Promise<boolean>;
  recruiters?: Array<User>;
}

export default function CandidateComments({
  candidate,
  type,
  recruiters = [],
  comments,
  saveToDatabase,
}: CandidateCommentsProps) {
  const { data: session, isPending } = useSession();

  const [commentsState, setCommentsState] = useState<Array<Comment>>(comments);

  const [commentValue, setCommentValue] = useState<Array<any> | undefined>(
    undefined,
  );

  const [editor, setEditor] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!commentValue) return;

    const prevComment = commentValue;

    setCommentsState([
      {
        user: {
          id: session?.user.id,
          name: session?.user.name,
          email: session?.user.email,
          emailVerified: session?.user.emailVerified,
          image: session?.user.image ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: "recruiter" as const,
        },
        comment: commentCreationMap[type](
          commentValue,
          session ? session.user.id : "",
        ) as ApplicationComment | InterviewComment | DynamicComment,
        type: type,
      },
      ...commentsState,
    ]);

    setCommentValue([]);

    editor.replaceBlocks(editor.topLevelBlocks, []);

    try {
      const res = await saveToDatabase(commentValue);

      if (!res) {
        setCommentValue(prevComment);
        setCommentsState(comments ?? []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {!isPending && session && (
        <form className="flex flex-row items-end gap-3" onSubmit={handleSubmit}>
          <div className="min-w-0 flex-1">
            <RealTimeEditor
              mentionItems={recruiters}
              onChange={(editor) => {
                setCommentValue(editor.document);
                setEditor(editor);
              }}
              collab={false}
              boxed={false}
            />
          </div>
          <Button
            variant="default"
            type="submit"
            size="icon"
            className="shrink-0"
            aria-label="Enviar comentário"
          >
            <Send />
          </Button>
        </form>
      )}

      <ScrollArea className="h-128 pr-2">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Separator className="my-4" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-xs font-medium text-muted-foreground">
              Comentários anteriores
            </span>
          </div>

          {commentsState?.map((comment, idx) => (
            <CommentDisplay
              key={`comment-${idx}`}
              comment={comment}
              candidate={candidate}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
