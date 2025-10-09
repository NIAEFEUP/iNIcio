import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAILJET_HOST,
  port: process.env.MAILJET_PORT,
  auth: {
    user: process.env.MAILJET_USER,
    pass: process.env.MAILJET_PASS,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html: string,
) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}
