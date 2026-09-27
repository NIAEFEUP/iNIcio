import { getSession } from "@/lib/auth";
import { addDynamicTemplate, getDynamicTemplate } from "@/lib/dynamic";
import { getInterviewTemplate, addInterviewTemplate } from "@/lib/interview";
import { generateJWT } from "@/lib/jwt";
import { getRole } from "@/lib/role";

import AdminTemplateClient from "@/components/admin/admin-template-client";
import { db } from "@/lib/db";
import { dynamic, interview } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAdminSession } from "@/lib/action-guard";
import { getTargetRecruitment } from "@/lib/selected-recruitment";
import { resetWebSocketRooms } from "@/lib/websocket";

export default async function AdminTemplates() {
  const session = await getSession();

  const interviewTemplate = await getInterviewTemplate();
  const dynamicTemplate = await getDynamicTemplate();

  const addInterviewTemplateAction = async (update: any) => {
    "use server";
    await requireAdminSession();

    try {
      await addInterviewTemplate(update);
    } catch (error) {
      console.error("Error saving interview template:", error);
      throw error;
    }
  };

  const addDynamicTemplateAction = async (update: any) => {
    "use server";
    await requireAdminSession();

    try {
      await addDynamicTemplate(update);
    } catch (error) {
      console.error("Error saving dynamic template:", error);
      throw error;
    }
  };

  const interviewOverrideAction = async (update: any) => {
    "use server";
    await requireAdminSession();

    const target = await getTargetRecruitment();
    if (!target) return;

    let contentToPush = update;
    if (
      !contentToPush ||
      (Array.isArray(contentToPush) && contentToPush.length === 0)
    ) {
      const currentTpl = await getInterviewTemplate();
      contentToPush = currentTpl.content;
    } else {
      await addInterviewTemplate(contentToPush);
    }

    if (
      !contentToPush ||
      (Array.isArray(contentToPush) && contentToPush.length === 0)
    ) {
      throw new Error("O modelo de entrevista está vazio.");
    }

    try {
      const unlockedInterviews = await db
        .select({ candidateId: interview.candidateId })
        .from(interview)
        .where(
          and(
            eq(interview.recruitmentId, target.id),
            eq(interview.locked, false),
          ),
        );

      await db
        .update(interview)
        .set({ content: contentToPush })
        .where(
          and(
            eq(interview.recruitmentId, target.id),
            eq(interview.locked, false),
          ),
        );

      const roomNames = unlockedInterviews.map(
        (i) => `interview-${i.candidateId}`,
      );
      await resetWebSocketRooms(roomNames);
    } catch (error) {
      console.error("Error overriding interview template:", error);
      throw error;
    }
  };

  const dynamicOverrideAction = async (update: any) => {
    "use server";
    await requireAdminSession();

    const target = await getTargetRecruitment();
    if (!target) return;

    let contentToPush = update;
    if (
      !contentToPush ||
      (Array.isArray(contentToPush) && contentToPush.length === 0)
    ) {
      const currentTpl = await getDynamicTemplate();
      contentToPush = currentTpl.content;
    } else {
      await addDynamicTemplate(contentToPush);
    }

    if (
      !contentToPush ||
      (Array.isArray(contentToPush) && contentToPush.length === 0)
    ) {
      throw new Error("O modelo de dinâmica está vazio.");
    }

    try {
      const unlockedDynamics = await db
        .select({ id: dynamic.id })
        .from(dynamic)
        .where(
          and(eq(dynamic.recruitmentId, target.id), eq(dynamic.locked, false)),
        );

      await db
        .update(dynamic)
        .set({ content: contentToPush })
        .where(
          and(eq(dynamic.recruitmentId, target.id), eq(dynamic.locked, false)),
        );

      const roomNames = unlockedDynamics.map((d) => `dynamic-${d.id}`);
      await resetWebSocketRooms(roomNames);
    } catch (error) {
      console.error("Error overriding dynamic template:", error);
      throw error;
    }
  };

  const jwt = await generateJWT(
    session?.user.id,
    await getRole(session?.user.id),
    ["interview-template-room", "dynamic-template-room"],
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
