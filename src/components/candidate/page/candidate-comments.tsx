"use client";

import { ReadOnlyBlocks } from "@/components/editor/read-only-blocks";
import RealTimeEditor from "@/components/editor/real-time-editor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
                  className="flex flex-row items-center gap-4"
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
        <Separator className="mb-4" />
        {commentsState?.map((comment, idx) => {
          return (
            <div
              key={`comment-${idx}`}
              className="flex p-4 rounded-lg bg-muted/50 w-full"
            >
              <div className="flex flex-col md:flex-row w-full gap-4">
                <div className="flex flex-row items-center gap-4">
                  <Avatar className="h-8 w-8 ring-4 ring-primary/10 ring-offset-4 ring-offset-background transition-all duration-300 group-hover:ring-primary/20">
                    <AvatarImage
                      src={comment.user.image || "/placeholder.svg"}
                      alt={comment.user.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xl font-semibold">
                      {comment?.user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm text-foreground">
                    {comment.user.name}
                  </span>
                </div>
                <ReadOnlyBlocks
                  blocks={comment.application_comment.content as Array<any>}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
