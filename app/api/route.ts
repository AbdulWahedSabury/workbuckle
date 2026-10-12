import { getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";
import { getContactFormSchema } from "@/schemas/ContactFormSchema";
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
