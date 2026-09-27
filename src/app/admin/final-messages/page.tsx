import { getSession } from "@/lib/auth";
import { generateJWT } from "@/lib/jwt";
import { getRole } from "@/lib/role";
import { PageHeader } from "@/components/layout/page-header";

import { db } from "@/lib/db";
import { finalMessageTemplate } from "@/db/schema";
import {
  addAcceptedMessageTemplate,
  addRejectedMessageTemplate,
  getAcceptedMessageTemplate,
  getRejectedMessageTemplate,
} from "@/lib/final-messages";
import AdminFinalMessageClient from "@/components/admin/admin-final-message-client";
import { eq } from "drizzle-orm";
import { requireAdminSession } from "@/lib/action-guard";

export default async function AdminTemplates() {
  const session = await getSession();

  const acceptedTemplate = await getAcceptedMessageTemplate();
  const rejectedTemplate = await getRejectedMessageTemplate();

  const addAcceptedMessageTemplateAction = async (update: any) => {
    "use server";
    await requireAdminSession();

    try {
      await addAcceptedMessageTemplate(update);
    } catch (error) {
      console.error("Error saving accepted message template:", error);
      throw error;
    }
  };

  const addRejectedMessageTemplateAction = async (update: any) => {
    "use server";
    await requireAdminSession();

    try {
      await addRejectedMessageTemplate(update);
    } catch (error) {
      console.error("Error saving rejected message template:", error);
      throw error;
    }
  };

  const acceptedMessageOverrideAction = async (update: any) => {
    "use server";
    await requireAdminSession();

    try {
      await db
        .update(finalMessageTemplate)
        .set({ content: update })
        .where(eq(finalMessageTemplate.type, "approved"));
    } catch (error) {
      console.error("Error saving accepted message template:", error);
      throw error;
    }
  };

  const rejectedMessageOverrideAction = async (update: any) => {
    "use server";
    await requireAdminSession();

    try {
      await db
        .update(finalMessageTemplate)
        .set({ content: update })
        .where(eq(finalMessageTemplate.type, "rejected"));
    } catch (error) {
      console.error("Error saving rejected message template:", error);
      throw error;
    }
  };

  const jwt = await generateJWT(
    session?.user.id,
    await getRole(session?.user.id),
    ["accepted-message-template-room", "rejected-message-template-room"],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mensagens Finais" />
      <AdminFinalMessageClient
        acceptedMessageOverrideAction={acceptedMessageOverrideAction}
        rejectedMessageOverrideAction={rejectedMessageOverrideAction}
        addAcceptedMessageTemplateAction={addAcceptedMessageTemplateAction}
        addRejectedMessageTemplateAction={addRejectedMessageTemplateAction}
        session={session}
        jwt={jwt}
        acceptedMessageTemplate={acceptedTemplate}
        rejectedMessageTemplate={rejectedTemplate}
      />
    </div>
  );
}
