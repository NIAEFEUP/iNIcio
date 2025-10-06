import { auth } from "@/lib/auth";
import { addDynamicTemplate, getDynamicTemplate } from "@/lib/dynamic";
import { getInterviewTemplate, addInterviewTemplate } from "@/lib/interview";
import { generateJWT } from "@/lib/jwt";
import { getRole } from "@/lib/role";
import { headers } from "next/headers";

import AdminTemplateClient from "@/components/admin/admin-template-client";

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

  const jwt = await generateJWT(
    session?.user.id,
    await getRole(session?.user.id),
  );

  return (
    <AdminTemplateClient
      addInterviewTemplateAction={addInterviewTemplateAction}
      addDynamicTemplateAction={addDynamicTemplateAction}
      session={session}
      jwt={jwt}
      interviewTemplate={interviewTemplate}
      dynamicTemplate={dynamicTemplate}
    />
  );
}
