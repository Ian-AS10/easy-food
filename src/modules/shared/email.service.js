const domain = process.env.DOMAIN_MAIL || "easyfood.com";
let mailerSend = null;
let EmailParams, Sender, Recipient;

try {
  const mailersendPkg = require("mailersend");
  EmailParams = mailersendPkg.EmailParams;
  Sender = mailersendPkg.Sender;
  Recipient = mailersendPkg.Recipient;
  if (process.env.MAILER_API) {
    mailerSend = new mailersendPkg.MailerSend({ apiKey: process.env.MAILER_API });
  }
} catch (e) {
  console.warn("MailerSend package not loaded, using email mock");
}

const sentFrom = Sender ? new Sender(`no-reply@${domain}`, "EasyFood") : null;

// Monta o HTML do e-mail a partir das três partes
function buildHtml({ header, body, footer }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${header}</h2>
      <div>${body}</div>
      <hr />
      <p style="color: #888; font-size: 12px;">${footer}</p>
    </div>
  `;
}

async function sendEmail({ to, toName, subject, header, body, footer }) {
  if (!mailerSend || !EmailParams) {
    console.log(`[EMAIL MOCK] Simulação para ${to} — "${subject}"`);
    return;
  }

  const recipients = [new Recipient(to, toName || to)];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject(subject)
    .setHtml(buildHtml({ header, body, footer }))
    .setText(`${header}\n\n${body}\n\n${footer}`);

  await mailerSend.email.send(emailParams);

  console.log(`[EMAIL] Enviado para ${to} — "${subject}"`);
}

module.exports = { sendEmail };