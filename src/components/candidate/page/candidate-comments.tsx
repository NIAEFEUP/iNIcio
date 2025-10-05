"use client";

import { CommentDisplay } from "@/components/comments/comment-display";
import RealTimeEditor from "@/components/editor/real-time-editor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import { authClient } from "@/lib/auth-client";
import {
  ApplicationComment,
  DynamicComment,
  InterviewComment,
  NewApplicationComment,
  User,
} from "@/lib/db";
import { Send } from "lucide-react";
import { useState } from "react";

import { commentCreationMap } from "@/lib/comment-format";

type CommentType = "application" | "interview" | "dynamic";

export type Comment = {
  user: User | null;
  comment: ApplicationComment | InterviewComment | DynamicComment | null;
  type: CommentType;
};

interface CandidateCommentsProps {
  type: CommentType;
  comments: Array<Comment>;
  saveToDatabase: (content: Array<any>) => Promise<boolean>;
  recruiters?: Array<User>;
}

export default function CandidateComments({
  type,
  recruiters = [],
  comments,
  saveToDatabase,
}: CandidateCommentsProps) {
  const { data: session } = authClient.useSession();

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
    <ScrollArea className="h-128 flex flex-col gap-4">
      <Table>
        <TableBody className="w-full">
          {session && (
            <TableRow className="flex flex-col md:flex-row items-center mx-4">
              <TableCell className="w-full">
                <form
                  className="flex flex-row items-center justify-center gap-4"
                  onSubmit={handleSubmit}
                >
                  <RealTimeEditor
                    mentionItems={recruiters}
                    onChange={(editor) => {
                      setCommentValue(editor.document);
                      setEditor(editor);
                    }}
                  />
                  <Button variant="default" type="submit" className="h-32">
                    <Send />
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div>
        <div className="relative">
          <Separator className="my-8" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-xs font-medium text-muted-foreground">
            Comentários anteriores
          </span>
        </div>
        <div className="flex flex-col gap-4">
          {commentsState?.map((comment, idx) => (
            <CommentDisplay key={`comment-${idx}`} comment={comment} />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
