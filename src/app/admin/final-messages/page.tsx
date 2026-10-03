import { getSession } from "@/lib/auth";
import { generateJWT } from "@/lib/jwt";
import { getRole } from "@/lib/role";
import { db } from "@/lib/db";
import { finalMessageTemplate } from "@/db/schema";
import {
  addAcceptedMessageTemplate,
  addRejectedMessageTemplate,
  getAcceptedMessageTemplate,
  getRejectedMessageTemplate,
} from "@/lib/final-messages";
import AdminFinalMessageClient from "@/components/admin/admin-final-message-client";
import { and, eq } from "drizzle-orm";
import { requireAdminSession } from "@/lib/action-guard";
import { getTargetRecruitment } from "@/lib/selected-recruitment";

export default async function AdminFinalMessagesPage() {
  const session = await getSession();
  const target = await getTargetRecruitment();

  const acceptedTemplate = await getAcceptedMessageTemplate(target?.id);
  const rejectedTemplate = await getRejectedMessageTemplate(target?.id);

  const addAcceptedMessageTemplateAction = async (update: any) => {
    "use server";
    await requireAdminSession();
    const currentTarget = await getTargetRecruitment();
    if (!currentTarget) {
      throw new Error("Nenhum recrutamento ativo ou selecionado.");
    }

    try {
      await addAcceptedMessageTemplate(update, currentTarget.id);
    } catch (error) {
      console.error("Error saving accepted message template:", error);
      throw error;
    }
  };

  const addRejectedMessageTemplateAction = async (update: any) => {
    "use server";
    await requireAdminSession();
    const currentTarget = await getTargetRecruitment();
    if (!currentTarget) {
      throw new Error("Nenhum recrutamento ativo ou selecionado.");
    }

    try {
      await addRejectedMessageTemplate(update, currentTarget.id);
    } catch (error) {
      console.error("Error saving rejected message template:", error);
      throw error;
    }
  };

  const acceptedMessageOverrideAction = async (update: any) => {
    "use server";
    await requireAdminSession();
    const currentTarget = await getTargetRecruitment();
    if (!currentTarget) {
      throw new Error("Nenhum recrutamento ativo ou selecionado.");
    }

    try {
      await db.transaction(async (tx) => {
        const template = await tx.query.finalMessageTemplate.findFirst({
          where: and(
            eq(finalMessageTemplate.type, "approved"),
            eq(finalMessageTemplate.recruitmentId, currentTarget.id),
          ),
        });
        if (template) {
          await tx
            .update(finalMessageTemplate)
            .set({ content: update })
            .where(eq(finalMessageTemplate.id, template.id));
        } else {
          await tx.insert(finalMessageTemplate).values({
            content: update,
            type: "approved",
            recruitmentId: currentTarget.id,
          });
        }
      });
    } catch (error) {
      console.error("Error overriding accepted message template:", error);
      throw error;
    }
  };

  const rejectedMessageOverrideAction = async (update: any) => {
    "use server";
    await requireAdminSession();
    const currentTarget = await getTargetRecruitment();
    if (!currentTarget) {
      throw new Error("Nenhum recrutamento ativo ou selecionado.");
    }

    try {
      await db.transaction(async (tx) => {
        const template = await tx.query.finalMessageTemplate.findFirst({
          where: and(
            eq(finalMessageTemplate.type, "rejected"),
            eq(finalMessageTemplate.recruitmentId, currentTarget.id),
          ),
        });
        if (template) {
          await tx
            .update(finalMessageTemplate)
            .set({ content: update })
            .where(eq(finalMessageTemplate.id, template.id));
        } else {
          await tx.insert(finalMessageTemplate).values({
            content: update,
            type: "rejected",
            recruitmentId: currentTarget.id,
          });
        }
      });
    } catch (error) {
      console.error("Error overriding rejected message template:", error);
      throw error;
    }
  };

  const jwt = await generateJWT(
    session?.user.id,
    await getRole(session?.user.id),
    [
      `accepted-message-template-room-${target?.id ?? "global"}`,
      `rejected-message-template-room-${target?.id ?? "global"}`,
    ],
  );

  return (
    <AdminFinalMessageClient
      key={target?.id ?? "default"}
      recruitmentTitle={target?.title}
      acceptedMessageOverrideAction={acceptedMessageOverrideAction}
      rejectedMessageOverrideAction={rejectedMessageOverrideAction}
      addAcceptedMessageTemplateAction={addAcceptedMessageTemplateAction}
      addRejectedMessageTemplateAction={addRejectedMessageTemplateAction}
      session={session}
      jwt={jwt}
      acceptedMessageTemplate={acceptedTemplate}
      rejectedMessageTemplate={rejectedTemplate}
    />
  );
}
