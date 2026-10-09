"use client";

import { useRef, useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { VoteValue } from "@/lib/comment-vote";

interface CommentVoteButtonsProps {
  upvotes: number;
  downvotes: number;
  userVote: VoteValue;
  onVote: (value: VoteValue) => void | Promise<void>;
  disabled?: boolean;
}

export function CommentVoteButtons({
  upvotes,
  downvotes,
  userVote,
  onVote,
  disabled = false,
}: CommentVoteButtonsProps) {
  // One vote request per comment at a time: while a request is in flight,
  // further clicks are ignored so a stale response can never overwrite a
  // later selection.
  const pendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const handleVote = (value: VoteValue) => {
    if (disabled || pendingRef.current) return;

    pendingRef.current = true;
    setIsPending(true);
    Promise.resolve(onVote(value)).finally(() => {
      pendingRef.current = false;
      setIsPending(false);
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Toggle
        aria-label="Upvote"
        disabled={disabled || isPending}
        pressed={userVote === 1}
        onPressedChange={(pressed) => handleVote(pressed ? 1 : null)}
        size="sm"
      >
        <ArrowUp className="size-3.5" />
        <span className="text-xs tabular-nums">{upvotes}</span>
      </Toggle>
      <Toggle
        aria-label="Downvote"
        disabled={disabled || isPending}
        pressed={userVote === -1}
        onPressedChange={(pressed) => handleVote(pressed ? -1 : null)}
        size="sm"
      >
        <ArrowDown className="size-3.5" />
        <span className="text-xs tabular-nums">{downvotes}</span>
      </Toggle>
    </div>
  );
}
