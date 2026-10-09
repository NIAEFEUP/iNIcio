import { getSession } from "@/lib/auth";
import { addDynamicTemplate, getDynamicTemplate } from "@/lib/dynamic";
import { getInterviewTemplate, addInterviewTemplate } from "@/lib/interview";

import AdminTemplateClient from "@/components/admin/admin-template-client";
import { db } from "@/lib/db";
import {
  dynamic,
  dynamicTemplate as dynamicTemplateTable,
  interview,
  interviewTemplate as interviewTemplateTable,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAdminSession } from "@/lib/action-guard";
import { getTargetRecruitment } from "@/lib/selected-recruitment";

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
    if (!target) {
      throw new Error("Nenhum recrutamento ativo ou selecionado.");
    }

    let contentToPush = update;
    if (
      !contentToPush ||
      (Array.isArray(contentToPush) && contentToPush.length === 0)
    ) {
      const currentTpl = await getInterviewTemplate();
      contentToPush = currentTpl.content;
    }

    if (
      !contentToPush ||
      (Array.isArray(contentToPush) && contentToPush.length === 0)
    ) {
      throw new Error("O modelo de entrevista está vazio.");
    }

    try {
      await db.transaction(async (tx) => {
        if (update && (!Array.isArray(update) || update.length > 0)) {
          const [template] = await tx
            .select()
            .from(interviewTemplateTable)
            .limit(1);

          if (template) {
            await tx
              .update(interviewTemplateTable)
              .set({ content: contentToPush })
              .where(eq(interviewTemplateTable.id, template.id));
          } else {
            await tx
              .insert(interviewTemplateTable)
              .values({ content: contentToPush });
          }
        }

        await tx
          .update(interview)
          .set({ content: contentToPush })
          .where(
            and(
              eq(interview.recruitmentId, target.id),
              eq(interview.locked, false),
            ),
          );
      });
    } catch (error) {
      console.error("Error overriding interview template:", error);
      throw error;
    }
  };

  const dynamicOverrideAction = async (update: any) => {
    "use server";
    await requireAdminSession();

    const target = await getTargetRecruitment();
    if (!target) {
      throw new Error("Nenhum recrutamento ativo ou selecionado.");
    }

    let contentToPush = update;
    if (
      !contentToPush ||
      (Array.isArray(contentToPush) && contentToPush.length === 0)
    ) {
      const currentTpl = await getDynamicTemplate();
      contentToPush = currentTpl.content;
    }

    if (
      !contentToPush ||
      (Array.isArray(contentToPush) && contentToPush.length === 0)
    ) {
      throw new Error("O modelo de dinâmica está vazio.");
    }

    try {
      await db.transaction(async (tx) => {
        if (update && (!Array.isArray(update) || update.length > 0)) {
          const [template] = await tx
            .select()
            .from(dynamicTemplateTable)
            .limit(1);

          if (template) {
            await tx
              .update(dynamicTemplateTable)
              .set({ content: contentToPush })
              .where(eq(dynamicTemplateTable.id, template.id));
          } else {
            await tx
              .insert(dynamicTemplateTable)
              .values({ content: contentToPush });
          }
        }

        await tx
          .update(dynamic)
          .set({ content: contentToPush })
          .where(
            and(
              eq(dynamic.recruitmentId, target.id),
              eq(dynamic.locked, false),
            ),
          );
      });
    } catch (error) {
      console.error("Error overriding dynamic template:", error);
      throw error;
    }
  };

  return (
    <AdminTemplateClient
      interviewOverrideAction={interviewOverrideAction}
      dynamicOverrideAction={dynamicOverrideAction}
      addInterviewTemplateAction={addInterviewTemplateAction}
      addDynamicTemplateAction={addDynamicTemplateAction}
      session={session}
      interviewTemplate={interviewTemplate}
      dynamicTemplate={dynamicTemplate}
    />
  );
}
