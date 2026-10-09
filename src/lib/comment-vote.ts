import { and, eq, inArray, sql } from "drizzle-orm";
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

type DbClient = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

// Aggregate in the database so callers transfer one row per comment instead
// of every vote row.
async function countCommentVotes(
  client: DbClient,
  table: CommentVoteTable,
  commentIds: number[],
  userId: string,
): Promise<Map<number, CommentVoteSummary>> {
  if (commentIds.length === 0) return new Map();

  const rows = await client
    .select({
      commentId: table.commentId,
      upvotes: sql<number>`count(*) filter (where ${table.value} = 1)`,
      downvotes: sql<number>`count(*) filter (where ${table.value} = -1)`,
      userVote: sql<
        number | null
      >`max(case when ${table.userId} = ${userId} then ${table.value} end)`,
    })
    .from(table)
    .where(inArray(table.commentId, commentIds))
    .groupBy(table.commentId);

  const summaries = new Map<number, CommentVoteSummary>();
  for (const row of rows) {
    summaries.set(row.commentId, {
      upvotes: Number(row.upvotes),
      downvotes: Number(row.downvotes),
      userVote: (row.userVote ?? null) as VoteValue,
    });
  }

  return summaries;
}

export async function loadCommentVotes(
  table: CommentVoteTable,
  commentIds: number[],
  userId: string,
): Promise<Map<number, CommentVoteSummary>> {
  return countCommentVotes(db, table, commentIds, userId);
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

    const votes = await countCommentVotes(tx, table, [commentId], userId);

    return votes.get(commentId) ?? EMPTY_COMMENT_VOTE;
  });
}
