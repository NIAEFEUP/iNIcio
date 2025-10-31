import { finalMessageTemplate } from "@/db/schema";
import { db, FinalMessageTemplate } from "./db";
import { eq } from "drizzle-orm";
import { getLatestVotingDecisionForCandidate } from "./voting";

export async function getMessage(candidateId: string) {
  const result = await getLatestVotingDecisionForCandidate(candidateId);

  if (result.decision === "reject") {
    return { decision: "rejected", message: await getRejectedMessage() };
  } else {
    return { decision: "approved", message: await getAcceptedMessage() };
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
