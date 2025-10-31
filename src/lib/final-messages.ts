import {
  interview,
  interviewComment,
  interviewTemplate,
  slot,
  recruiterToInterview,
  finalMessageTemplate,
} from "@/db/schema";
import { db, InterviewTemplate, Slot, FinalMessageTemplate } from "./db";
import { and, eq, gt } from "drizzle-orm";
import { getFilenameUrl } from "./file-upload";
import { Comment } from "@/components/candidate/page/candidate-comments";
import { getLatestVotingDecisionForCandidate } from "./voting";

export async function getMessage(candidateId: string) {
  const result = await getLatestVotingDecisionForCandidate(candidateId);

  if (result.decision === "reject") {
    return getRejectedMessage();
  } else {
    return getAcceptedMessage();
  }
}

export async function getAcceptedMessage() {
  const message = await db
    .select()
    .from(finalMessageTemplate)
    .where(eq(finalMessageTemplate.type, "approved"));
  return message[0];
}

export async function getRejectedMessage() {
  const message = await db
    .select()
    .from(finalMessageTemplate)
    .where(eq(finalMessageTemplate.type, "rejected"));
  return message[0];
}

export async function updateInterview(candidateId: string, content: any) {
  // TODO: 2 of these
  await db.transaction(async (trx) => {
    await trx
      .update(interview)
      .set({ content: content })
      .where(eq(interview.candidateId, candidateId));
  });
}

export async function addInterviewTemplate(content: Array<any>) {
  // TODO: i need on of these for the other message
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

export async function addAcceptedMessageTemplate(content: Array<any>) {
  if (content.length === 0) return;

  await db.transaction(async (trx) => {
    const template = await trx.query.finalMessageTemplate.findFirst({
      where: eq(finalMessageTemplate.type, "approved"),
    });
    if (template) {
      await trx
        .update(finalMessageTemplate)
        .set({ content: content })
        .where(eq(finalMessageTemplate.id, template.id));
    } else {
      await trx
        .insert(finalMessageTemplate)
        .values({ content: content, type: "approved" });
    }
  });
}

export async function addRejectedMessageTemplate(content: Array<any>) {
  if (content.length === 0) return;

  await db.transaction(async (trx) => {
    const template = await trx.query.finalMessageTemplate.findFirst({
      where: eq(finalMessageTemplate.type, "rejected"),
    });
    if (template) {
      await trx
        .update(finalMessageTemplate)
        .set({ content: content })
        .where(eq(finalMessageTemplate.id, template.id));
    } else {
      await trx
        .insert(finalMessageTemplate)
        .values({ content: content, type: "rejected" });
    }
  });
}

export async function getAcceptedMessageTemplate(): Promise<FinalMessageTemplate> {
  const template = (await db.query.finalMessageTemplate.findFirst({
    where: eq(finalMessageTemplate.type, "approved"),
  })) as FinalMessageTemplate;

  if (!template) {
    return {
      id: 0,
      content: [],
      type: "approved",
    };
  }

  return template;
}

export async function getRejectedMessageTemplate(): Promise<FinalMessageTemplate> {
  const template = (await db.query.finalMessageTemplate.findFirst({
    where: eq(finalMessageTemplate.type, "rejected"),
  })) as FinalMessageTemplate;

  if (!template) {
    return {
      id: 1,
      content: [],
      type: "rejected",
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
