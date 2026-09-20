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

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Recuperação da palavra-passe",
      text: `Olá ${name},\n\nRecebemos um pedido para alterar a tua palavra-passe. Abre esta ligação para continuar:\n${url}\n\nA ligação expira dentro de uma hora. Se não fizeste este pedido, podes ignorar este email.`,
      html: `<p>Olá ${escapeHtml(name)},</p><p>Recebemos um pedido para alterar a tua palavra-passe.</p><p><a href="${escapeHtml(url)}">Alterar palavra-passe</a></p><p>Esta ligação expira dentro de uma hora. Se não fizeste este pedido, podes ignorar este email.</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível enviar o email de recuperação");
  }
}
