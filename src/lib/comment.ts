import {
  application,
  applicationComment,
  applicationCommentVote,
  dynamic,
  dynamicComment,
  dynamicCommentVote,
  interview,
  interviewComment,
  interviewCommentVote,
  user,
} from "@/db/schema";
import { db } from "./db";
import { and, desc, eq } from "drizzle-orm";
import { getFilenameUrl } from "./file-upload";
import { Comment } from "@/components/candidate/page/candidate-comments";
import {
  applyCommentVote,
  EMPTY_COMMENT_VOTE,
  loadCommentVotes,
  type CommentVoteSummary,
  type VoteValue,
} from "./comment-vote";
import { getActiveRecruitment } from "./recruitment";

export async function addApplicationComment(
  applicationId: number,
  content: Array<any>,
  authorId: string,
) {
  const id = await db
    .insert(applicationComment)
    .values({
      applicationId,
      content,
      authorId,
    })
    .returning({ id: applicationComment.id });

  return id;
}

export async function updateApplicationComment(
  commentId: number,
  content: Array<any>,
  authorId: string,
  candidateId: string,
  recruitmentId: number,
): Promise<boolean> {
  const app = await db
    .select({ id: application.id })
    .from(application)
    .where(
      and(
        eq(application.candidateId, candidateId),
        eq(application.recruitmentId, recruitmentId),
      ),
    );

  if (app.length === 0) return false;

  const updated = await db
    .update(applicationComment)
    .set({ content, editedAt: new Date() })
    .where(
      and(
        eq(applicationComment.id, commentId),
        eq(applicationComment.authorId, authorId),
        eq(applicationComment.applicationId, app[0].id),
      ),
    )
    .returning({ id: applicationComment.id });

  return updated.length > 0;
}

export async function getApplicationComments(
  candidateId: string,
  userId: string,
  recruitmentId?: number,
): Promise<Array<Comment>> {
  const targetId = recruitmentId ?? (await getActiveRecruitment())?.id;
  if (!targetId) return [];

  const whereClause = and(
    eq(application.candidateId, candidateId),
    eq(application.recruitmentId, targetId),
  );

  const app = await db.select().from(application).where(whereClause);

  if (app.length === 0) return [];

  const results = await db
    .select()
    .from(applicationComment)
    .where(eq(applicationComment.applicationId, app[0].id))
    .fullJoin(user, eq(applicationComment.authorId, user.id))
    .orderBy(desc(applicationComment.createdAt), desc(applicationComment.id));

  const votes = await loadCommentVotes(
    applicationCommentVote,
    results
      .map((e) => e.application_comment.id)
      .filter((id): id is number => id != null),
    userId,
  );

  return await Promise.all(
    results.map(async (e): Promise<Comment> => ({
      user: {
        ...e.user,
        image: await getFilenameUrl(e.user.image),
      },
      comment: {
        ...e.application_comment,
      },
      type: "application",
      ...(votes.get(e.application_comment.id) ?? EMPTY_COMMENT_VOTE),
    })),
  );
}

export async function getDynamicComments(
  dynamicId: number,
  userId: string,
): Promise<Array<Comment>> {
  const results = await db.query.dynamicComment.findMany({
    where: eq(dynamicComment.dynamicId, dynamicId),
    with: {
      author: {
        with: {
          user: true,
        },
      },
    },
  });

  const votes = await loadCommentVotes(
    dynamicCommentVote,
    results.map((e) => e.id),
    userId,
  );

  return await Promise.all(
    results.map(async (e): Promise<Comment> => ({
      user: {
        ...e.author.user,
        image: await getFilenameUrl(e.author.user.image),
      },
      comment: {
        id: e.id,
        content: e.content,
        createdAt: e.createdAt,
        editedAt: e.editedAt,
        dynamicId: e.dynamicId,
        authorId: e.authorId,
      },
      type: "dynamic",
      ...(votes.get(e.id) ?? EMPTY_COMMENT_VOTE),
    })),
  );
}

export async function voteApplicationComment(
  commentId: number,
  userId: string,
  value: VoteValue,
  candidateId: string,
  recruitmentId: number,
): Promise<CommentVoteSummary | null> {
  const app = await db
    .select({ id: application.id })
    .from(application)
    .where(
      and(
        eq(application.candidateId, candidateId),
        eq(application.recruitmentId, recruitmentId),
      ),
    );

  if (app.length === 0) return null;

  const comment = await db
    .select({
      id: applicationComment.id,
      authorId: applicationComment.authorId,
    })
    .from(applicationComment)
    .where(
      and(
        eq(applicationComment.id, commentId),
        eq(applicationComment.applicationId, app[0].id),
      ),
    );

  if (comment.length === 0) return null;
  if (comment[0].authorId === userId) return null;

  return applyCommentVote(applicationCommentVote, commentId, userId, value);
}

export async function voteInterviewComment(
  commentId: number,
  userId: string,
  value: VoteValue,
  candidateId: string,
  recruitmentId: number,
): Promise<CommentVoteSummary | null> {
  const i = await db
    .select({ id: interview.id })
    .from(interview)
    .where(
      and(
        eq(interview.candidateId, candidateId),
        eq(interview.recruitmentId, recruitmentId),
      ),
    );

  if (i.length === 0) return null;

  const comment = await db
    .select({ id: interviewComment.id, authorId: interviewComment.authorId })
    .from(interviewComment)
    .where(
      and(
        eq(interviewComment.id, commentId),
        eq(interviewComment.interviewId, i[0].id),
      ),
    );

  if (comment.length === 0) return null;
  if (comment[0].authorId === userId) return null;

  return applyCommentVote(interviewCommentVote, commentId, userId, value);
}

export async function voteDynamicComment(
  commentId: number,
  userId: string,
  value: VoteValue,
  dynamicId: number,
  recruitmentId: number,
): Promise<CommentVoteSummary | null> {
  const dyn = await db
    .select({ id: dynamic.id })
    .from(dynamic)
    .where(
      and(eq(dynamic.id, dynamicId), eq(dynamic.recruitmentId, recruitmentId)),
    );

  if (dyn.length === 0) return null;

  const comment = await db
    .select({ id: dynamicComment.id, authorId: dynamicComment.authorId })
    .from(dynamicComment)
    .where(
      and(
        eq(dynamicComment.id, commentId),
        eq(dynamicComment.dynamicId, dyn[0].id),
      ),
    );

  if (comment.length === 0) return null;
  if (comment[0].authorId === userId) return null;

  return applyCommentVote(dynamicCommentVote, commentId, userId, value);
}
