"use client";

import { CommentDisplay } from "@/components/comments/comment-display";
import RealTimeEditor from "@/components/editor/real-time-editor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import { authClient } from "@/lib/auth-client";
import { ApplicationComment, NewApplicationComment, User } from "@/lib/db";
import { Send } from "lucide-react";
import { useState } from "react";

interface CandidateCommentsProps {
  comments: Array<{
    user: User | null;
    application_comment: ApplicationComment | null;
  }>;
  saveToDatabase: (content: Array<any>) => Promise<boolean>;
  recruiters?: Array<User>;
}

export default function CandidateComments({
  recruiters = [],
  comments,
  saveToDatabase,
}: CandidateCommentsProps) {
  const { data: session } = authClient.useSession();

  const [commentsState, setCommentsState] = useState<
    Array<{
      user: User | null;
      application_comment: NewApplicationComment | null;
    }>
  >(comments);

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
        application_comment: {
          content: commentValue,
          authorId: session ? session.user.id : "",
          createdAt: new Date(),
          applicationId: 0,
        },
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
            <TableRow className="flex flex-col md:flex-row">
              <TableCell className="font-medium">{session.user.name}</TableCell>
              <TableCell className="w-full">
                <form
                  className="flex flex-row items-center justify-center gap-4"
                  onSubmit={handleSubmit}
                >
                  <RealTimeEditor
                    mentionItems={recruiters}
                    entity={{
                      content: commentValue,
                    }}
                    onChange={(editor) => {
                      setCommentValue(editor.document);
                      setEditor(editor);
                    }}
                  />
                  <Button variant="outline" type="submit">
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
