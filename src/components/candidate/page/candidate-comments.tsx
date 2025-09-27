"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { authClient } from "@/lib/auth-client";
import { ApplicationComment, User } from "@/lib/db";
import { Send } from "lucide-react";
import { useState } from "react";

interface CandidateCommentsProps {
  comments: Array<{
    user: User | null;
    application_comment: ApplicationComment | null;
  }>;
  saveToDatabase: (content: string) => Promise<boolean>;
}

export default function CandidateComments({
  comments,
  saveToDatabase,
}: CandidateCommentsProps) {
  const { data: session } = authClient.useSession();

  const [commentsState, setCommentsState] = useState<
    Array<{
      user: User | null;
      application_comment: ApplicationComment | null;
    }>
  >(comments);

  const [commentValue, setCommentValue] = useState<string | undefined>(
    undefined,
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!commentValue) return;

    const prevComment = commentValue;

    setCommentsState([
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
          id: 0,
          content: commentValue,
          authorId: session ? session.user.id : "",
          applicationId: 0,
        },
      },
      ...commentsState,
    ]);

    setCommentValue("");

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
    <ScrollArea className="h-64">
      <Table>
        <TableBody>
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
                  <Textarea
                    placeholder="Adicionar comentário"
                    className="w-5/6"
                    required
                    value={commentValue}
                    onChange={(e) => setCommentValue(e.target.value)}
                  />
                  <Button variant="outline" type="submit">
                    <Send />
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          )}

          {commentsState?.map((comment, idx) => (
            <div
              key={`comment-${idx}`}
              className="flex gap-3 p-4 rounded-lg bg-muted/50 w-full"
            >
              {/* <Avatar className="w-8 h-8"> */}
              {/*   <AvatarImage src={comment.avatar || "/placeholder.svg"} alt={comment.author} /> */}
              {/*   <AvatarFallback className="text-xs">{comment.author.charAt(0).toUpperCase()}</AvatarFallback> */}
              {/* </Avatar> */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">
                    {comment.user.name}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {comment.application_comment.content}
                </p>
              </div>
            </div>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
