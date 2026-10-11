"use server";

import { requireRecruiterSession } from "@/lib/action-guard";
import { isAdmin } from "@/lib/admin";
import { sendRecruitmentEmails } from "@/lib/email";
import {
  getEmailRecipients,
  type EmailRecipientsPayload,
} from "@/lib/email-recipients";
import { getRecruitmentById } from "@/lib/recruitment";
import { getTargetRecruitment } from "@/lib/selected-recruitment";

export type EmailComposerData = EmailRecipientsPayload & {
  /** Whether the current user may use the "Enviar via API" (Resend) action. */
  isAdmin: boolean;
};

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

  const [payload, admin] = await Promise.all([
    getEmailRecipients({
      recruitmentId: target.id,
      excludeUserId: sessionUser.id,
    }),
    isAdmin(sessionUser.id),
  ]);

  return { ...payload, isAdmin: Boolean(admin) };
}

export interface SendEmailViaApiInput {
  recruitmentId?: number;
  recipientIds: string[];
  subject: string;
  body: string;
}

/**
 * Sends the composer email through the Resend API instead of opening Gmail.
 * Recipient ids are re-resolved server-side so a recruiter can only email the
 * people the composer would have offered them.
 */
export async function sendEmailViaApi({
  recruitmentId,
  recipientIds,
  subject,
  body,
}: SendEmailViaApiInput): Promise<{ sent: number }> {
  const target = await resolveTargetRecruitment(recruitmentId);
  if (!target) {
    throw new Error("Não há nenhum recrutamento ativo ou selecionado.");
  }

  const sessionUser = await requireRecruiterSession(target.id);

  // The Resend send is an admin-only capability.
  if (!(await isAdmin(sessionUser.id))) {
    throw new Error("Unauthorized: Admin privileges required");
  }

  const trimmedSubject = subject.trim();
  const trimmedBody = body.trim();

  if (!trimmedSubject) {
    throw new Error("O assunto do email é obrigatório.");
  }

  if (!trimmedBody) {
    throw new Error("O corpo do email é obrigatório.");
  }

  if (recipientIds.length === 0) {
    throw new Error("Seleciona pelo menos um destinatário.");
  }

  const { recipients } = await getEmailRecipients({
    recruitmentId: target.id,
    excludeUserId: sessionUser.id,
  });

  const emailById = new Map(
    recipients
      .filter((recipient) => Boolean(recipient.email))
      .map((recipient) => [recipient.id, recipient.email]),
  );

  const emails = [
    ...new Set(
      recipientIds
        .map((id) => emailById.get(id))
        .filter((email): email is string => Boolean(email)),
    ),
  ];

  if (emails.length === 0) {
    throw new Error("Nenhum destinatário válido selecionado.");
  }

  return sendRecruitmentEmails({
    recipients: emails,
    subject: trimmedSubject,
    body: trimmedBody,
  });
}
