import { getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";
import {
  ELAPSED_FIELD,
  HONEYPOT_FIELD,
  MIN_SUBMIT_MS,
  getContactFormSchema,
} from "@/schemas/ContactFormSchema";
import { CAPTCHA_FIELD } from "@/lib/captcha/config";
import { verifyCaptcha } from "@/lib/captcha/verify";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { getCorsHeaders } from "@/utils/cors";
import mailer from "@/utils/mailer";

const allowContactMessage = createRateLimiter("contact-message", 5, 15 * 60 * 1000);

/** Visitor input goes into the email's HTML, so it must not be able to inject markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailTemplate({
  firstName,
  lastName,
  email,
  phone,
  message,
  receivedAt,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  receivedAt: string;
}) {
  const name = `${firstName} ${lastName}`;
  const safeMessage = escapeHtml(message).replace(/\r\n?|\n/g, "<br>");
  const text = [
    "NEW CONTACT MESSAGE",
    `From: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Received: ${receivedAt}`,
    "",
    "MESSAGE",
    message,
    "",
    "Sent from the Work Buckle contact form.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>New contact message</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#0e0e0e;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f6f6;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e9e9e9;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="height:5px;background:#fc701c;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:26px 30px;background:#0e0e0e;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size:20px;line-height:28px;font-weight:700;letter-spacing:-0.3px;color:#ffffff;">Work <span style="color:#fc701c;">Buckle</span></td>
                    <td align="right"><span style="display:inline-block;padding:6px 10px;border:1px solid #ffffff33;border-radius:999px;color:#ffc39d;font-size:10px;line-height:14px;font-weight:700;letter-spacing:1px;">NEW MESSAGE</span></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 30px 12px;">
                <p style="margin:0 0 8px;color:#fc701c;font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Contact form</p>
                <h1 style="margin:0;font-size:26px;line-height:34px;font-weight:700;letter-spacing:-0.5px;color:#0e0e0e;">You have a new message</h1>
                <p style="margin:10px 0 0;color:#666666;font-size:14px;line-height:22px;">A visitor has reached out through the Work Buckle website.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 30px 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #ededed;border-radius:12px;">
                  <tr>
                    <td style="padding:14px 16px;border-bottom:1px solid #ededed;color:#777777;font-size:12px;line-height:18px;width:92px;">Name</td>
                    <td style="padding:14px 16px;border-bottom:1px solid #ededed;color:#0e0e0e;font-size:14px;line-height:20px;font-weight:700;">${escapeHtml(name)}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;border-bottom:1px solid #ededed;color:#777777;font-size:12px;line-height:18px;">Email</td>
                    <td style="padding:14px 16px;border-bottom:1px solid #ededed;font-size:14px;line-height:20px;"><a href="mailto:${escapeHtml(email)}" style="color:#b94f0b;text-decoration:underline;">${escapeHtml(email)}</a></td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px;color:#777777;font-size:12px;line-height:18px;">Phone</td>
                    <td style="padding:14px 16px;color:#0e0e0e;font-size:14px;line-height:20px;">${escapeHtml(phone)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 30px 30px;">
                <p style="margin:0 0 10px;color:#505050;font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Message</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8f8f8;border-left:3px solid #fc701c;">
                  <tr>
                    <td style="padding:18px 20px;color:#292929;font-size:14px;line-height:23px;overflow-wrap:anywhere;">${safeMessage}</td>
                  </tr>
                </table>
                <p style="margin:18px 0 0;color:#999999;font-size:11px;line-height:17px;">Received ${escapeHtml(receivedAt)} · Reply directly to this email to respond to ${escapeHtml(firstName)}.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:17px 30px;border-top:1px solid #eeeeee;color:#999999;font-size:11px;line-height:17px;">Work Buckle · Contact notification</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, text, name };
}

export async function OPTIONS(req: Request) {
  const headers = getCorsHeaders(req.headers.get("origin"));
  return new Response(null, { status: 204, headers });
}

/** Contact form submission: validates the fields and emails them to EMAIL_SENDER. */
export async function POST(req: Request) {
  const headers = getCorsHeaders(req.headers.get("origin"));

  if (!(await allowContactMessage(clientIp(req.headers)))) {
    return NextResponse.json(
      { success: false, message: "Too many requests" },
      { status: 429, headers },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400, headers },
    );
  }

  // Anti-spam, checked before validation so bots learn nothing from field errors.
  const fields = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  // Honeypot filled: answer exactly like a real success so the bot moves on.
  const honeypot = fields[HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    console.warn("Contact form: honeypot triggered, submission dropped");
    return NextResponse.json({ success: true, message: "Message sent successfully" }, { headers });
  }

  // Too fast (or missing, as with scripts posting straight to /api). A real
  // error, not a fake success: a fast human gets told to retry, and by then
  // enough time has passed.
  const elapsed = Number(fields[ELAPSED_FIELD]);
  if (!Number.isFinite(elapsed) || elapsed < MIN_SUBMIT_MS) {
    // The value isn't logged: it's visitor input and could forge log lines.
    console.warn("Contact form: submitted too fast, rejected");
    return NextResponse.json(
      { success: false, message: "Submission rejected" },
      { status: 422, headers },
    );
  }

  const t = await getTranslations("form");
  const validation = getContactFormSchema(t).safeParse(body);
  if (!validation.success) {
    const fieldErrors: Record<string, string[] | undefined> =
      validation.error.flatten().fieldErrors;
    const errors = Object.fromEntries(
      Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0] ?? "Invalid field"]),
    );
    return NextResponse.json(
      { success: false, message: "Validation failed", errors },
      { status: 400, headers },
    );
  }

  if (!(await verifyCaptcha(fields[CAPTCHA_FIELD]))) {
    return NextResponse.json(
      { success: false, message: "Captcha verification failed" },
      { status: 403, headers },
    );
  }

  const { first_name, last_name, phone, email, message } = validation.data;
  const receivedAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Nicosia",
  }).format(new Date());
  const emailContent = emailTemplate({
    firstName: first_name,
    lastName: last_name,
    email,
    phone,
    message,
    receivedAt,
  });
  const safeSubjectName = emailContent.name.replace(/[\r\n\t]+/g, " ").trim();

  try {
    await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_SENDER,
      replyTo: { name: safeSubjectName, address: email },
      subject: `New contact message from ${safeSubjectName}`,
      html: emailContent.html,
      text: emailContent.text,
    });
    return NextResponse.json({ success: true, message: "Message sent successfully" }, { headers });
  } catch (error) {
    // Logged server-side only: SMTP errors can include host and account details.
    console.error("Contact form email failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500, headers },
    );
  }
}
