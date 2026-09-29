import { and, eq, inArray } from "drizzle-orm";
import {
  applicationCommentVote,
  dynamicCommentVote,
  interviewCommentVote,
} from "@/db/schema";
import { db } from "./db";

export type VoteValue = 1 | -1 | null;

export type CommentVoteSummary = {
  upvotes: number;
  downvotes: number;
  userVote: VoteValue;
};

export const EMPTY_COMMENT_VOTE: CommentVoteSummary = {
  upvotes: 0,
  downvotes: 0,
  userVote: null,
};

// `VoteValue` is erased at build time, so server actions cannot rely on it to
// reject malformed runtime input. Validate before persisting anything.
export function isVoteValue(value: unknown): value is VoteValue {
  return value === 1 || value === -1 || value === null;
}

// The three vote tables are column-identical, so they share these helpers.
type CommentVoteTable =
  | typeof applicationCommentVote
  | typeof interviewCommentVote
  | typeof dynamicCommentVote;

type CommentVoteRow = {
  commentId: number;
  userId: string;
  value: number;
};

function tally(
  rows: Array<CommentVoteRow>,
  userId: string,
): Map<number, CommentVoteSummary> {
  const summaries = new Map<number, CommentVoteSummary>();

  for (const row of rows) {
    const summary = summaries.get(row.commentId) ?? {
      upvotes: 0,
      downvotes: 0,
      userVote: null,
    };

    if (row.value === 1) summary.upvotes += 1;
    else if (row.value === -1) summary.downvotes += 1;

    if (row.userId === userId) {
      summary.userVote = row.value as VoteValue;
    }

    summaries.set(row.commentId, summary);
  }

  return summaries;
}

export async function loadCommentVotes(
  table: CommentVoteTable,
  commentIds: number[],
  userId: string,
): Promise<Map<number, CommentVoteSummary>> {
  if (commentIds.length === 0) return new Map();

  const rows = (await db
    .select()
    .from(table)
    .where(inArray(table.commentId, commentIds))) as Array<CommentVoteRow>;

  return tally(rows, userId);
}

export async function applyCommentVote(
  table: CommentVoteTable,
  commentId: number,
  userId: string,
  value: VoteValue,
): Promise<CommentVoteSummary> {
  return db.transaction(async (tx) => {
    if (value === null) {
      await tx
        .delete(table)
        .where(and(eq(table.commentId, commentId), eq(table.userId, userId)));
    } else {
      await tx
        .insert(table)
        .values({ commentId, userId, value })
        .onConflictDoUpdate({
          target: [table.commentId, table.userId],
          set: { value },
        });
    }

    const rows = (await tx
      .select()
      .from(table)
      .where(eq(table.commentId, commentId))) as Array<CommentVoteRow>;

    return tally(rows, userId).get(commentId) ?? EMPTY_COMMENT_VOTE;
  });
}
