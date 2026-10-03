import { getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";
import { getContactFormSchema } from "@/schemas/ContactFormSchema";
import { getCorsHeaders } from "@/utils/cors";
import mailer from "@/utils/mailer";

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const headers = getCorsHeaders(origin);
  return new Response(null, { status: 204, headers });
}

export async function POST(req: Request) {
  const t = await getTranslations("form");

  // Handle CORS manually
  const origin = req.headers.get("origin");
  const headers = getCorsHeaders(origin);

  // Parse request body
  const body = await req.json();
  const schema = getContactFormSchema(t);

  // Validate with Zod
  const validation = schema.safeParse(body);
  if (!validation.success) {
    const errors: Record<string, string[]> =
      validation.error.flatten().fieldErrors;
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: Object.keys(errors).reduce(
          (acc, key) => ({
            ...acc,
            [key]: errors[key]?.[0] ?? "Invalid field",
          }),
          {},
        ),
      },
      { status: 400, headers },
    );
  }

  const { first_name, last_name, phone, email, message } = validation.data;

  // Prepare email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_SENDER,
    subject: `Contact from ${first_name} ${last_name}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>First Name:</strong> ${first_name}</p>
      <p><strong>Last Name:</strong> ${last_name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  };

  try {
    // Send email
    await mailer.sendMail(mailOptions);

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully",
      },
      { headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: `Failed to send message ${error}`,
      },
      { status: 500, headers },
    );
  }
}
