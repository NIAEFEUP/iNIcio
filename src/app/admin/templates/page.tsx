import { auth } from "@/lib/auth";
import { addDynamicTemplate, getDynamicTemplate } from "@/lib/dynamic";
import { getInterviewTemplate, addInterviewTemplate } from "@/lib/interview";
import { generateJWT } from "@/lib/jwt";
import { getRole } from "@/lib/role";
import { headers } from "next/headers";

import AdminTemplateClient from "@/components/admin/admin-template-client";
import { db } from "@/lib/db";
import { dynamic, interview } from "@/db/schema";

export default async function AdminTemplates() {
  const session = await auth.api.getSession({ headers: await headers() });

  const interviewTemplate = await getInterviewTemplate();
  const dynamicTemplate = await getDynamicTemplate();

  const addInterviewTemplateAction = async (update: any) => {
    "use server";

    try {
      await addInterviewTemplate(update);
    } catch (error) {
      console.error("Error saving interview template:", error);
      throw error;
    }
  };

  const addDynamicTemplateAction = async (update: any) => {
    "use server";

    try {
      await addDynamicTemplate(update);
    } catch (error) {
      console.error("Error saving dynamic template:", error);
      throw error;
    }
  };

  const interviewOverrideAction = async (update: any) => {
    "use server";

    try {
      await db.update(interview).set({ content: update });
    } catch (error) {
      console.error("Error saving interview template:", error);
      throw error;
    }
  };

  const dynamicOverrideAction = async (update: any) => {
    "use server";

    try {
      await db.update(dynamic).set({ content: update });
    } catch (error) {
      console.error("Error saving dynamic template:", error);
      throw error;
    }
  };

  const jwt = await generateJWT(
    session?.user.id,
    await getRole(session?.user.id),
  );

  return (
    <AdminTemplateClient
      interviewOverrideAction={interviewOverrideAction}
      dynamicOverrideAction={dynamicOverrideAction}
      addInterviewTemplateAction={addInterviewTemplateAction}
      addDynamicTemplateAction={addDynamicTemplateAction}
      session={session}
      jwt={jwt}
      interviewTemplate={interviewTemplate}
      dynamicTemplate={dynamicTemplate}
    />
  );
}
