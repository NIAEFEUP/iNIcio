"use server";

import { requireRecruiterSession } from "@/lib/action-guard";
import {
  getEmailRecipients,
  type EmailRecipientsPayload,
} from "@/lib/email-recipients";
import { getRecruitmentById } from "@/lib/recruitment";
import { getTargetRecruitment } from "@/lib/selected-recruitment";

export type EmailComposerData = EmailRecipientsPayload;

async function resolveTargetRecruitment(recruitmentId?: number) {
  if (recruitmentId) {
    const selected = await getRecruitmentById(recruitmentId);
    if (selected) return selected;
  }

  return getTargetRecruitment();
}

/**
 * Everything the "Enviar emails" modal needs: the selectable recipients and the
 * quick-send audiences for the recruitment.
 */
export async function getEmailComposerData(
  recruitmentId?: number,
): Promise<EmailComposerData | null> {
  const target = await resolveTargetRecruitment(recruitmentId);
  if (!target) return null;

  const sessionUser = await requireRecruiterSession(target.id);

  return getEmailRecipients({
    recruitmentId: target.id,
    excludeUserId: sessionUser.id,
  });
}
