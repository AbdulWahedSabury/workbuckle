import "server-only";
import nodemailer from "nodemailer";
import type { TransportOptions } from "nodemailer";

export default nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  // Mail carries CVs and the SMTP password, so refuse to fall back to plain text.
  requireTLS: true,
  tls: { minVersion: 'TLSv1.2' },
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
} as TransportOptions);
