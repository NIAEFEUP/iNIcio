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
  candidate: User;
}

export default function CandidateComments({
  comments,
  candidate,
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
      const res = await fetch(
        `/api/candidate/${candidate.id}/application/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: commentValue,
          }),
        },
      );

      if (!res.ok) {
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

          {commentsState?.map((comment) => (
            <TableRow key={crypto.randomUUID()}>
              <TableCell className="font-medium w-1/6">
                {comment.user?.name}
              </TableCell>
              <TableCell className="font-medium break-words whitespace-normal w-5/6">
                {comment.application_comment?.content}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
