/**
 * Client-safe constants and helpers for the "Enviar emails" composer. Kept free
 * of any Drizzle/`db` import so client components can pull from it directly.
 */

/**
 * Quick-send audiences. Each one maps to a set of candidate recipients that can
 * be selected in one click from the "Enviar emails" modal.
 */
export const EMAIL_TEMPLATE_TYPES = [
  "all",
  "not_applied",
  "no_interview",
  "no_dynamic",
  "no_scheduling",
] as const;

export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number];

/** Name of each audience, shown in the quick-send selector. */
export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateType, string> = {
  all: "Todos os candidatos",
  not_applied: "Não candidataram este ano",
  no_interview: "Sem entrevista marcada",
  no_dynamic: "Sem dinâmica marcada",
  no_scheduling: "Sem entrevista nem dinâmica",
};

/**
 * Base UI renders the raw `value` in `SelectValue` unless the root gets an
 * `items` map, so the selector needs this to display the audience name.
 */
export const EMAIL_TEMPLATE_ITEMS: Record<EmailTemplateType, string> =
  Object.fromEntries(
    EMAIL_TEMPLATE_TYPES.map((type) => [type, EMAIL_TEMPLATE_LABELS[type]]),
  ) as Record<EmailTemplateType, string>;

/** Above this length browsers/Gmail start truncating the compose URL. */
export const GMAIL_URL_LENGTH_WARNING = 8000;

/** Builds a Gmail web compose URL with the recipients hidden in BCC. */
export function buildGmailComposeUrl({
  recipients,
  subject,
  body,
}: {
  recipients: string[];
  subject: string;
  body: string;
}): string {
  const params = new URLSearchParams({ view: "cm", fs: "1" });

  const emails = recipients.map((email) => email.trim()).filter(Boolean);
  if (emails.length > 0) params.set("bcc", emails.join(","));
  if (subject.trim()) params.set("su", subject.trim());
  if (body.trim()) params.set("body", body);

  return `https://mail.google.com/mail/?${params.toString()}`;
}
