type PasswordResetEmailData = {
  name: string;
  email: string;
  url: string;
};

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
