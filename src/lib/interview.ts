import {
  interview,
  interviewComment,
  interviewTemplate,
  slot,
  recruiterToInterview,
} from "@/db/schema";
import { db, InterviewTemplate, Slot } from "./db";
import { and, eq, gt } from "drizzle-orm";
import { getFilenameUrl } from "./file-upload";
import { Comment } from "@/components/candidate/page/candidate-comments";

export default async function addInterviewWithSlot(
  candidateId: string,
  slotParam: Slot,
) {
  await db.transaction(async (trx) => {
    const s = await trx
      .select()
      .from(slot)
      .where(and(eq(slot.id, slotParam.id), gt(slot.quantity, 0)))
      .for("update");

    if (s.length > 0) {
      await trx
        .update(slot)
        .set({ quantity: s[0].quantity - 1 })
        .where(eq(slot.id, slotParam.id));

      const i = await trx.query.interview.findFirst({
        where: eq(interview.candidateId, candidateId),
        with: {
          slot: true,
        },
      });

      if (i) {
        await trx
          .update(slot)
          .set({ quantity: i.slot.quantity + 1 })
          .where(eq(slot.id, i.slot.id));

        await trx
          .update(interview)
          .set({ slot: slotParam.id })
          .where(eq(interview.id, i.id));
      } else {
        const interviewTemplate = await trx.query.interviewTemplate.findFirst();

        await trx.insert(interview).values({
          slot: slotParam.id,
          candidateId: candidateId,
          content: interviewTemplate ? interviewTemplate.content : [],
        });

        // We do not need to decrease quantity of the new slot of the interview because it was already done so in
        // the beggining of the if
      }
    }
  });
}

export async function getInterview(candidateId: string) {
  const interviews = await db
    .select()
    .from(interview)
    .where(eq(interview.candidateId, candidateId));
  return interviews[0];
}

export async function getInterviewers(interviewId: number) {
  const interviewers = await db.query.recruiterToInterview.findMany({
    where: eq(recruiterToInterview.interviewId, interviewId),
    with: {
      recruiter: {
        with: {
          user: true,
        },
      },
    },
  });
  return interviewers.map((interviewer) => interviewer.recruiter.user);
}

export async function updateInterview(candidateId: string, content: any) {
  await db.transaction(async (trx) => {
    await trx
      .update(interview)
      .set({ content: content })
      .where(eq(interview.candidateId, candidateId));
  });
}

export async function addInterviewComment(
  authorId: string,
  content: Array<any>,
  candidateId: string,
): Promise<boolean> {
  return await db.transaction(async (trx) => {
    const i = await trx
      .select()
      .from(interview)
      .where(eq(interview.candidateId, candidateId))
      .for("update");

    if (i.length === 0) return false;

    try {
      await trx.insert(interviewComment).values({
        content,
        authorId,
        interviewId: i[0].id,
      });

      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  });
}

export async function addInterviewTemplate(content: Array<any>) {
  if (content.length === 0) return;

  await db.transaction(async (trx) => {
    const template = await trx.query.interviewTemplate.findFirst();

    if (template) {
      await trx.update(interviewTemplate).set({ content: content });
    } else {
      await trx.insert(interviewTemplate).values({ content: content });
    }
  });
}

export async function getInterviewTemplate(): Promise<InterviewTemplate> {
  const template =
    (await db.query.interviewTemplate.findFirst()) as InterviewTemplate;

  if (!template) {
    return {
      id: 0,
      content: [],
    };
  }

  return template;
}

export function getCandidateInterviewLink(candidateId: string) {
  return `/candidate/${candidateId}/interview`;
}

export async function getInterviewComments(
  interviewId: number,
): Promise<Array<Comment>> {
  const comments = await db.query.interviewComment.findMany({
    where: eq(interviewComment.interviewId, interviewId),
    with: {
      author: {
        with: {
          user: true,
        },
      },
    },
  });

  return await Promise.all(
    comments.map(
      async (c): Promise<Comment> => ({
        user: {
          ...c.author.user,
          image: await getFilenameUrl(c.author.user.image),
        },
        comment: {
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          interviewId: c.interviewId,
          authorId: c.authorId,
        },
        type: "interview",
      }),
    ),
  );
}
