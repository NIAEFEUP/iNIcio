"use server";

import { requireRecruiterSession } from "@/lib/action-guard";
import { isAdmin } from "@/lib/admin";
import { sendRecruitmentEmails } from "@/lib/email";
import {
  getEmailRecipients,
  type EmailRecipientsPayload,
} from "@/lib/email-recipients";
import {
  getAcceptedMessageTemplate,
  getRejectedMessageTemplate,
} from "@/lib/final-messages";
import { getRecruitmentById } from "@/lib/recruitment";
import { getTargetRecruitment } from "@/lib/selected-recruitment";

export type EmailComposerData = EmailRecipientsPayload & {
  /** Whether the current user may use the "Enviar via API" (Resend) action. */
  isAdmin: boolean;
  /**
   * The recruitment the composer operates on. Recipients and the inserted
   * final-message templates always correspond to this same recruitment.
   */
  recruitmentId: number;
};

/**
 * Resolves the recruitment the composer operates on. The server-side selection
 * (`getTargetRecruitment`: the sidebar cookie, else the active recruitment) is
 * authoritative — it is the exact source the admin "Mensagens finais" page uses
 * to scope its templates — so the recipients and the inserted templates always
 * correspond to the selected recruitment. The client-passed id is only a
 * fallback for when no selection or active recruitment exists.
 */
async function resolveTargetRecruitment(recruitmentId?: number) {
  const target = await getTargetRecruitment();
  if (target) return target;

  if (recruitmentId) {
    const selected = await getRecruitmentById(recruitmentId);
    if (selected) return selected;
  }

  return null;
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

  return { ...payload, isAdmin: Boolean(admin), recruitmentId: target.id };
}

export interface SendEmailViaApiInput {
  recruitmentId?: number;
  recipientIds: string[];
  subject: string;
  /** Rich-text HTML of the body, rendered by the composer's editor. */
  html: string;
  /** Plain-text version of the body. */
  text: string;
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
  html,
  text,
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
  const trimmedHtml = html.trim();
  const trimmedText = text.trim();

  if (!trimmedSubject) {
    throw new Error("O assunto do email é obrigatório.");
  }

  if (!trimmedHtml) {
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
    html: trimmedHtml,
    text: trimmedText,
  });
}

export interface FinalMessageTemplateContent {
  accepted: unknown[];
  rejected: unknown[];
}

/**
 * The accepted/rejected final message template content, so an admin can insert
 * them into the email body. Recruiters (non-admins) get `null`.
 */
export async function getFinalMessageTemplateContent(
  recruitmentId?: number,
): Promise<FinalMessageTemplateContent | null> {
  const target = await resolveTargetRecruitment(recruitmentId);
  if (!target) return null;

  const sessionUser = await requireRecruiterSession(target.id);
  if (!(await isAdmin(sessionUser.id))) return null;

  const [accepted, rejected] = await Promise.all([
    getAcceptedMessageTemplate(target.id),
    getRejectedMessageTemplate(target.id),
  ]);

  return {
    accepted: (accepted?.content ?? []) as unknown[],
    rejected: (rejected?.content ?? []) as unknown[],
  };
}
