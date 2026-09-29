"use client";

import { Toggle } from "@/components/ui/toggle";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { VoteValue } from "@/components/candidate/page/candidate-comments";

interface CommentVoteButtonsProps {
  upvotes: number;
  downvotes: number;
  userVote: VoteValue;
  onVote: (value: VoteValue) => void;
}

export function CommentVoteButtons({
  upvotes,
  downvotes,
  userVote,
  onVote,
}: CommentVoteButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <Toggle
        aria-label="Upvote"
        pressed={userVote === 1}
        onPressedChange={(pressed) => onVote(pressed ? 1 : null)}
        size="sm"
      >
        <ArrowUp className="size-3.5" />
        <span className="text-xs tabular-nums">{upvotes}</span>
      </Toggle>
      <Toggle
        aria-label="Downvote"
        pressed={userVote === -1}
        onPressedChange={(pressed) => onVote(pressed ? -1 : null)}
        size="sm"
      >
        <ArrowDown className="size-3.5" />
        <span className="text-xs tabular-nums">{downvotes}</span>
      </Toggle>
    </div>
  );
}
