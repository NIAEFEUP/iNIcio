"use client";

import { ReadOnlyBlocks } from "@/components/editor/read-only-blocks";
import RealTimeEditor from "@/components/editor/real-time-editor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}

export default function CandidateComments({
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
      ...commentsState,
      {
        user: session
          ? {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
              emailVerified: session.user.emailVerified,
              image: session.user.image ?? null,
              createdAt: new Date(),
              updatedAt: new Date(),
              role: "recruiter" as const,
            }
          : null,
        application_comment: {
          content: commentValue,
          authorId: session ? session.user.id : "",
          applicationId: 0,
        },
      },
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
            <TableRow>
              <TableCell className="font-medium w-1/6">
                {session.user.name}
              </TableCell>
              <TableCell className="w-5/6">
                <form
                  className="flex flex-row items-center gap-4"
                  onSubmit={handleSubmit}
                >
                  <RealTimeEditor
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
        {commentsState?.map((comment, idx) => (
          <div
            key={`comment-${idx}`}
            className="flex p-4 rounded-lg bg-muted/50 w-full"
          >
            <div className="flex-1 space-y-1 w-full">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground">
                  {comment.user.name}
                </span>
              </div>
              <ReadOnlyBlocks
                blocks={comment.application_comment.content as Array<any>}
              />
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
