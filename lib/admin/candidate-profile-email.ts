import 'server-only';
import { CV_BUCKET, cvObjectPath } from '@/lib/cv-storage';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Role } from '@/lib/generated/prisma/enums';
import { clientRecipients } from '@/lib/admin/client-recipients';
import mailer from '@/utils/mailer';

const MAX_CV_BYTES = 10 * 1024 * 1024;
const SIGNATURE_EMAIL = 'info@mavromatisservices.com';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeSubject(value: string) {
  return value.replace(/[\r\n\t]+/g, ' ').trim();
}

async function loadCv(candidate: { cvPath: string | null; cvUrl: string }) {
  const filePath = cvObjectPath(candidate);
  if (!filePath) throw new Error('The candidate CV is not in the configured storage bucket.');

  const { data, error } = await getSupabaseAdmin().storage.from(CV_BUCKET).download(filePath);
  if (error) throw error;
  if (!data) throw new Error('The candidate CV was not found in storage.');
  const bytes = Buffer.from(await data.arrayBuffer());

  if (bytes.byteLength === 0 || bytes.byteLength > MAX_CV_BYTES) {
    throw new Error('The candidate CV is empty or exceeds the 10 MB attachment limit.');
  }
  const extension = filePath.split('.').pop()?.toLowerCase();
  if (!extension || !['pdf', 'doc', 'docx'].includes(extension)) {
    throw new Error('The candidate CV must be a PDF, DOC or DOCX file.');
  }
  const contentType = extension === 'pdf'
    ? 'application/pdf'
    : extension === 'doc'
      ? 'application/msword'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return { bytes, extension, contentType };
}

function makeEmail({ candidateName, jobTitle, clientName, notes, cvAttached, portalUrl }: {
  candidateName: string;
  jobTitle: string;
  clientName: string;
  notes: string;
  cvAttached: boolean;
  /** Link to this candidate in the client's portal; null when the client has no login. */
  portalUrl: string | null;
}) {
  const attachments = cvAttached
    ? 'Their full CV and pre-screening interview notes are attached to this email.'
    : `Their pre-screening interview notes are attached to this email${portalUrl ? '; their CV is available in your Work Buckle portal' : ''}.`;
  const portalText = portalUrl
    ? `You can review the candidate, record the interview and confirm your hiring decision in your Work Buckle portal: ${portalUrl}`
    : '';
  const safeName = escapeHtml(candidateName);
  const safeJob = escapeHtml(jobTitle);
  const safeClient = escapeHtml(clientName);
  const text = [
    `Dear ${clientName},`,
    '',
    'I hope this email finds you well.',
    '',
    'At Work Buckle, we have completed our initial screening and pre-screening interview process for your open position. Based on your requirements, I am pleased to present our selected top candidate for the role.',
    '',
    'Candidate Overview',
    `Candidate Name: ${candidateName}`,
    `Target Position: ${jobTitle}`,
    '',
    `We believe this candidate aligns closely with the high standards expected by your team. ${attachments}`,
    '',
    ...(portalText ? [portalText, ''] : []),
    'Please let me know your availability this week so we can coordinate the next step and schedule the employer interview.',
    '',
    'Best regards,',
    '',
    'Demetris Vassilakkas',
    'Recruitment Specialist',
    'Work Buckle',
    `${SIGNATURE_EMAIL} | +357 77 776707`,
    'workbuckle.com',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Selected Candidate Profile</title></head>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#0e0e0e;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f6f6;padding:32px 12px;"><tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#fff;border:1px solid #e9e9e9;border-radius:18px;overflow:hidden;">
      <tr><td style="height:5px;background:#fc701c;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:26px 30px;background:#0e0e0e;color:#fff;font-size:20px;line-height:28px;font-weight:700;">Work <span style="color:#fc701c;">Buckle</span></td></tr>
      <tr><td style="padding:32px 30px 12px;"><p style="margin:0 0 8px;color:#fc701c;font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Candidate presentation</p><h1 style="margin:0;font-size:26px;line-height:34px;color:#0e0e0e;">Selected candidate profile</h1><p style="margin:10px 0 0;color:#666;font-size:14px;line-height:22px;">${safeJob}</p></td></tr>
      <tr><td style="padding:20px 30px 8px;color:#292929;font-size:14px;line-height:23px;"><p style="margin:0 0 16px;">Dear ${safeClient},</p><p style="margin:0 0 16px;">I hope this email finds you well.</p><p style="margin:0 0 16px;">At Work Buckle, we have completed our initial screening and pre-screening interview process for your open position. Based on your requirements, I am pleased to present our selected top candidate for the <strong>${safeJob}</strong> role.</p></td></tr>
      <tr><td style="padding:8px 30px 22px;"><p style="margin:0 0 10px;color:#505050;font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Candidate overview</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #ededed;border-radius:12px;"><tr><td style="padding:14px 16px;border-bottom:1px solid #ededed;color:#777;font-size:12px;line-height:18px;width:140px;">Candidate name</td><td style="padding:14px 16px;border-bottom:1px solid #ededed;color:#0e0e0e;font-size:14px;line-height:20px;font-weight:700;">${safeName}</td></tr><tr><td style="padding:14px 16px;color:#777;font-size:12px;line-height:18px;">Target position</td><td style="padding:14px 16px;color:#0e0e0e;font-size:14px;line-height:20px;font-weight:700;">${safeJob}</td></tr></table></td></tr>
      <tr><td style="padding:0 30px;color:#292929;font-size:14px;line-height:23px;"><p style="margin:0 0 16px;">We believe this candidate aligns closely with the high standards expected by your team. ${escapeHtml(attachments)}</p>${portalUrl ? `<p style="margin:0 0 16px;">You can review the candidate, record the interview and confirm your hiring decision in your Work Buckle portal.</p><p style="margin:0 0 22px;"><a href="${escapeHtml(portalUrl)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#fc701c;color:#0e0e0e;font-weight:700;text-decoration:none;">Open candidate in portal</a></p>` : ''}<p style="margin:0 0 22px;">Please let me know your availability this week so we can coordinate the next step and schedule the employer interview.</p><p style="margin:0 0 4px;">Best regards,</p><p style="margin:18px 0 0;font-weight:700;color:#0e0e0e;">Demetris Vassilakkas</p><p style="margin:2px 0;color:#666;">Recruitment Specialist<br>Work Buckle</p><p style="margin:8px 0 0;"><a href="mailto:${SIGNATURE_EMAIL}" style="color:#b94f0b;text-decoration:underline;">${SIGNATURE_EMAIL}</a> <span style="color:#999;">|</span> <a href="tel:+35777776707" style="color:#b94f0b;text-decoration:underline;">+357 77 776707</a><br><a href="https://workbuckle.com" style="color:#b94f0b;text-decoration:underline;">workbuckle.com</a></p></td></tr>
      <tr><td style="padding:20px 30px;margin-top:24px;border-top:1px solid #eee;color:#999;font-size:11px;line-height:17px;">Confidential candidate information · Work Buckle</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
  const notesAttachment = [
    `Pre-screening interview notes: ${candidateName}`,
    `Position: ${jobTitle}`,
    '',
    notes,
  ].join('\n');
  return { subject: `Selected Candidate Profile: ${safeSubject(candidateName)} for ${safeSubject(jobTitle)} - Work Buckle`, text, html, notesAttachment };
}

type ProfileEmailResult = { error?: string; notice?: string };

/** Where the panel lives, from the request (localhost in dev, the live domain in production). */
async function panelOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    if (host) return `${h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')}://${host}`;
  } catch {
    // Outside a request (scripts): fall through.
  }
  return 'https://workbuckle.com';
}

/** The CV as an attachment, or null when the file can't be loaded (the email still goes out). */
async function loadCvOrNull(application: { cvPath: string | null; cvUrl: string }) {
  try {
    return await loadCv(application);
  } catch (error) {
    console.error('Candidate CV could not be attached to the profile email:', error);
    return null;
  }
}

async function loadApplication(applicationId: string) {
  return prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      candidate: { select: { firstName: true, lastName: true } },
      job: { include: { client: { include: { users: { where: { role: Role.EMPLOYER }, select: { email: true } } } } } },
    },
  });
}

/**
 * Sends an application's candidate profile to its client once: to the client's
 * own logins (Client users), or to the client's email when it has none.
 * Callers must enforce admin access.
 */
export async function sendCandidateProfileEmail(applicationId: string): Promise<ProfileEmailResult> {
  const application = await loadApplication(applicationId);
  if (!application) return { error: 'This application no longer exists.' };
  if (application.clientProfileEmailSentAt) return {};
  if (application.status !== 'submitted') return { error: 'Set the application status to submitted first.' };
  const { client } = application.job;
  const recipients = clientRecipients(client);
  if (!recipients.length) return { error: 'Add a client login or an email address to this job’s client before sending.' };
  const screeningNotes = application.screeningNotes;
  if (!screeningNotes?.trim()) return { error: 'Add pre-screening interview notes before sending.' };
  const fromEmail = process.env.EMAIL_USER;
  if (!fromEmail) return { error: 'Email sending is not configured on the server.' };

  const candidateName = `${application.candidate.firstName} ${application.candidate.lastName}`;
  const cv = await loadCvOrNull(application);
  const portalUrl = client.users.length ? `${await panelOrigin()}/admin/candidates/${application.id}` : null;
  const email = makeEmail({
    candidateName,
    jobTitle: application.job.title,
    clientName: client.name,
    notes: screeningNotes,
    cvAttached: Boolean(cv),
    portalUrl,
  });
  const safeFileName = candidateName.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '') || 'candidate';

  try {
    await mailer.sendMail({
      from: { name: 'Work Buckle', address: fromEmail },
      to: recipients,
      replyTo: { name: 'Demetris Vassilakkas | Work Buckle', address: SIGNATURE_EMAIL },
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: [
        ...(cv ? [{ filename: `${safeFileName}-CV.${cv.extension}`, content: cv.bytes, contentType: cv.contentType }] : []),
        { filename: `${safeFileName}-pre-screening-notes.txt`, content: email.notesAttachment, contentType: 'text/plain; charset=utf-8' },
      ],
    });
  } catch (error) {
    console.error('Selected candidate profile email failed:', error);
    return { error: 'The status was updated, but the email could not be sent. You can retry from the candidate profile.' };
  }

  await prisma.jobApplication.update({ where: { id: application.id }, data: { clientProfileEmailSentAt: new Date() } });
  return cv ? {} : { notice: `Emailed to ${recipients.join(', ')} without the CV: the CV file couldn’t be loaded from storage.` };
}
