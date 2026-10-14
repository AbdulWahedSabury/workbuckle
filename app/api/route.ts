import { getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";
import {
  ELAPSED_FIELD,
  HONEYPOT_FIELD,
  MIN_SUBMIT_MS,
  getContactFormSchema,
} from "@/schemas/ContactFormSchema";
import { getCorsHeaders } from "@/utils/cors";
import mailer from "@/utils/mailer";

/** Visitor input goes into the email's HTML, so it must not be able to inject markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function OPTIONS(req: Request) {
  const headers = getCorsHeaders(req.headers.get("origin"));
  return new Response(null, { status: 204, headers });
}

/** Contact form submission: validates the fields and emails them to EMAIL_SENDER. */
export async function POST(req: Request) {
  const headers = getCorsHeaders(req.headers.get("origin"));

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
    console.warn(`Contact form: submitted too fast (${String(fields[ELAPSED_FIELD])}ms), rejected`);
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

  const { first_name, last_name, phone, email, message } = validation.data;
  const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>First Name:</strong> ${escapeHtml(first_name)}</p>
      <p><strong>Last Name:</strong> ${escapeHtml(last_name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\r?\n/g, "<br>")}</p>
    `;

  try {
    await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_SENDER,
      subject: `Contact from ${first_name} ${last_name}`,
      html,
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
