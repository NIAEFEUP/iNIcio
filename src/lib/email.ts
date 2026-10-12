type PasswordResetEmailData = {
  name: string;
  email: string;
  url: string;
};

const DEFAULT_EMAIL_FROM_NAME = "Recrutamento | NIAEFEUP";

function withFromName(address: string) {
  if (address.includes("<")) return address;
  const name = process.env.EMAIL_FROM_NAME?.trim() || DEFAULT_EMAIL_FROM_NAME;
  return `${name} <${address}>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendPasswordResetEmail({
  name,
  email,
  url,
}: PasswordResetEmailData) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[DEV] Password reset email requested, but email configuration is missing.",
      );
      return;
    }
    throw new Error("RESEND_API_KEY e EMAIL_FROM têm de estar configurados");
  }

  const appUrl = process.env.BETTER_AUTH_URL;
  const logoUrl = "https://niaefeup.pt/images/logo_2018_watermark.svg";
  const safeAppUrl = escapeHtml(appUrl ?? "");
  const safeLogoUrl = escapeHtml(logoUrl);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "iNicio | Recuperação da palavra-passe",
      html: `
        <div style="background-color:#f8f7f5;margin:0;padding:32px 16px;font-family:Arial,sans-serif;color:#242424;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background-color:#ffffff;border:1px solid #eeeeee;border-radius:12px;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #eeeeee;">
                <a href="${safeAppUrl}" style="display:inline-flex;align-items:center;text-decoration:none;">
                  <img src="${safeLogoUrl}" width="80" alt="NIAEFEUP" style="display:block;width:80px;height:auto;border:0;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px;">Olá ${escapeHtml(name)},</p>
                <p style="margin:0 0 24px;">Recebemos um pedido para alterar a tua palavra-passe.</p>
                <a href="${escapeHtml(url)}" style="display:inline-block;background-color:#b33636;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Alterar palavra-passe</a>
                <p style="margin:24px 0 0;color:#666666;font-size:14px;">Este link expira dentro de uma hora. Se não fizeste este pedido, podes ignorar este email.</p>
              </td>
            </tr>
          </table>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível enviar o email de recuperação");
  }
}

/** Resend's batch endpoint accepts at most 100 emails per request. */
const RESEND_BATCH_LIMIT = 100;

/** Wraps the composer's rich-text HTML in a light, branded email layout. */
function buildRecruitmentEmailHtml(contentHtml: string) {
  return `
    <div style="background-color:#f8f7f5;margin:0;padding:32px 16px;font-family:Arial,sans-serif;color:#242424;font-size:14px;line-height:1.6;">
      <div style="max-width:560px;margin:0 auto;background-color:#ffffff;border:1px solid #eeeeee;border-radius:12px;padding:32px;">
        ${contentHtml}
      </div>
    </div>
  `;
}

export interface SendRecruitmentEmailsData {
  recipients: string[];
  subject: string;
  /** Rich-text (BlockNote) HTML rendered by the composer. */
  html: string;
  /** Plain-text fallback of the body for clients without HTML. */
  text: string;
}

/**
 * Sends one copy of the composer email to each recipient through Resend. Uses
 * the batch endpoint so a large audience goes out in as few requests as
 * possible, and so recipients never see each other's addresses.
 */
export async function sendRecruitmentEmails({
  recipients,
  subject,
  html,
  text,
}: SendRecruitmentEmailsData) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY e EMAIL_FROM têm de estar configurados");
  }

  const fromWithName = withFromName(from);

  const emails = [
    ...new Set(recipients.map((email) => email.trim()).filter(Boolean)),
  ];

  if (emails.length === 0) {
    throw new Error("Nenhum destinatário selecionado");
  }

  const wrappedHtml = buildRecruitmentEmailHtml(html);
  let sent = 0;

  for (let i = 0; i < emails.length; i += RESEND_BATCH_LIMIT) {
    const batch = emails.slice(i, i + RESEND_BATCH_LIMIT);

    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        batch.map((to) => ({
          from: fromWithName,
          to: [to],
          subject,
          html: wrappedHtml,
          text,
        })),
      ),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Não foi possível enviar os emails (Resend: ${response.status}${
          detail ? ` ${detail}` : ""
        })`,
      );
    }

    sent += batch.length;
  }

  return { sent };
}
