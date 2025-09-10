"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { authClient } from "@/lib/auth-client";
import { ApplicationComment, User } from "@/lib/db";
import { Send } from "lucide-react";
import { useState } from "react";

interface CandidateCommentsProps {
  comments: Array<{ application_comment: ApplicationComment; user: User }>;
  candidate: User;
}

export default function CandidateComments({
  comments,
  candidate,
}: CandidateCommentsProps) {
  const { data: session } = authClient.useSession();

  console.log("comments: ", comments);

  const [commentValue, setCommentValue] = useState<string | undefined>(
    undefined,
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    await fetch(`/api/candidate/${candidate.id}/application/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: commentValue,
      }),
    });
  };

  return (
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

        {comments?.map((comment) => (
          <TableRow key={comment.application_comment.id}>
            <TableCell className="font-medium w-1/6">
              {comment.user.name}
            </TableCell>
            <TableCell className="font-medium break-words whitespace-normal w-5/6">
              {comment.application_comment.content}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
