import { auth } from "@/lib/auth";
import { generateJWT } from "@/lib/jwt";
import { getRole } from "@/lib/role";
import { headers } from "next/headers";

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

export default async function AdminTemplates() {
  const session = await auth.api.getSession({ headers: await headers() });

  const acceptedTemplate = await getAcceptedMessageTemplate();
  const rejectedTemplate = await getRejectedMessageTemplate();

  const addAcceptedMessageTemplateAction = async (update: any) => {
    "use server";

    try {
      await addAcceptedMessageTemplate(update);
    } catch (error) {
      console.error("Error saving accepted message template:", error);
      throw error;
    }
  };

  const addRejectedTemplateAction = async (update: any) => {
    "use server";

    try {
      await addRejectedMessageTemplate(update);
    } catch (error) {
      console.error("Error saving rejected message template:", error);
      throw error;
    }
  };

  const acceptedMessageOverrideAction = async (update: any) => {
    "use server";

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
  );

  return (
    <AdminFinalMessageClient
      acceptedMessageOverrideAction={acceptedMessageOverrideAction}
      rejectedMessageOverrideAction={rejectedMessageOverrideAction}
      addAcceptedMessageTemplateAction={addAcceptedMessageTemplateAction}
      addRejectedMessageTemplateAction={addRejectedTemplateAction}
      session={session}
      jwt={jwt}
      acceptedMessageTemplate={acceptedTemplate}
      rejectedMessageTemplate={rejectedTemplate}
    />
  );
}
