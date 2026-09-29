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
import { and, desc, eq, inArray } from "drizzle-orm";
import { getFilenameUrl } from "./file-upload";
import {
  Comment,
  CommentVoteSummary,
  VoteValue,
} from "@/components/candidate/page/candidate-comments";
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

  const commentIds = results
    .map((e) => e.application_comment.id)
    .filter((id): id is number => id != null);

  const votes =
    commentIds.length > 0
      ? await db
          .select()
          .from(applicationCommentVote)
          .where(inArray(applicationCommentVote.commentId, commentIds))
      : [];

  const countsById = new Map<number, { upvotes: number; downvotes: number }>();
  const userVotesById = new Map<number, VoteValue>();

  for (const v of votes) {
    const current = countsById.get(v.commentId) ?? {
      upvotes: 0,
      downvotes: 0,
    };
    if (v.value === 1) current.upvotes += 1;
    else if (v.value === -1) current.downvotes += 1;
    countsById.set(v.commentId, current);

    if (v.userId === userId) {
      userVotesById.set(v.commentId, v.value as VoteValue);
    }
  }

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
      upvotes: countsById.get(e.application_comment.id)?.upvotes ?? 0,
      downvotes: countsById.get(e.application_comment.id)?.downvotes ?? 0,
      userVote: userVotesById.get(e.application_comment.id) ?? null,
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

  const commentIds = results.map((e) => e.id);

  const votes =
    commentIds.length > 0
      ? await db
          .select()
          .from(dynamicCommentVote)
          .where(inArray(dynamicCommentVote.commentId, commentIds))
      : [];

  const countsById = new Map<number, { upvotes: number; downvotes: number }>();
  const userVotesById = new Map<number, VoteValue>();

  for (const v of votes) {
    const current = countsById.get(v.commentId) ?? {
      upvotes: 0,
      downvotes: 0,
    };
    if (v.value === 1) current.upvotes += 1;
    else if (v.value === -1) current.downvotes += 1;
    countsById.set(v.commentId, current);

    if (v.userId === userId) {
      userVotesById.set(v.commentId, v.value as VoteValue);
    }
  }

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
      upvotes: countsById.get(e.id)?.upvotes ?? 0,
      downvotes: countsById.get(e.id)?.downvotes ?? 0,
      userVote: userVotesById.get(e.id) ?? null,
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

  return db.transaction(async (tx) => {
    if (value === null) {
      await tx
        .delete(applicationCommentVote)
        .where(
          and(
            eq(applicationCommentVote.commentId, commentId),
            eq(applicationCommentVote.userId, userId),
          ),
        );
    } else {
      await tx
        .insert(applicationCommentVote)
        .values({ commentId, userId, value })
        .onConflictDoUpdate({
          target: [
            applicationCommentVote.commentId,
            applicationCommentVote.userId,
          ],
          set: { value },
        });
    }

    const votes = await tx
      .select()
      .from(applicationCommentVote)
      .where(eq(applicationCommentVote.commentId, commentId));

    const upvotes = votes.filter((v) => v.value === 1).length;
    const downvotes = votes.filter((v) => v.value === -1).length;

    return { upvotes, downvotes, userVote: value };
  });
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

  return db.transaction(async (tx) => {
    if (value === null) {
      await tx
        .delete(interviewCommentVote)
        .where(
          and(
            eq(interviewCommentVote.commentId, commentId),
            eq(interviewCommentVote.userId, userId),
          ),
        );
    } else {
      await tx
        .insert(interviewCommentVote)
        .values({ commentId, userId, value })
        .onConflictDoUpdate({
          target: [interviewCommentVote.commentId, interviewCommentVote.userId],
          set: { value },
        });
    }

    const votes = await tx
      .select()
      .from(interviewCommentVote)
      .where(eq(interviewCommentVote.commentId, commentId));

    const upvotes = votes.filter((v) => v.value === 1).length;
    const downvotes = votes.filter((v) => v.value === -1).length;

    return { upvotes, downvotes, userVote: value };
  });
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

  return db.transaction(async (tx) => {
    if (value === null) {
      await tx
        .delete(dynamicCommentVote)
        .where(
          and(
            eq(dynamicCommentVote.commentId, commentId),
            eq(dynamicCommentVote.userId, userId),
          ),
        );
    } else {
      await tx
        .insert(dynamicCommentVote)
        .values({ commentId, userId, value })
        .onConflictDoUpdate({
          target: [dynamicCommentVote.commentId, dynamicCommentVote.userId],
          set: { value },
        });
    }

    const votes = await tx
      .select()
      .from(dynamicCommentVote)
      .where(eq(dynamicCommentVote.commentId, commentId));

    const upvotes = votes.filter((v) => v.value === 1).length;
    const downvotes = votes.filter((v) => v.value === -1).length;

    return { upvotes, downvotes, userVote: value };
  });
}
