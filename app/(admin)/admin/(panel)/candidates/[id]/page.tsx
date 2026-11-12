import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, Phone } from "lucide-react";
import AdminOnly from "@/components/admin/AdminOnly";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import ApplicationStatusSelect from "@/components/admin/ApplicationStatusSelect";
import CandidateAvailabilitySelect from "@/components/admin/CandidateAvailabilitySelect";
import CandidateScreeningNotesForm from "@/components/admin/CandidateScreeningNotesForm";
import InterviewForm from "@/components/admin/InterviewForm";
import RetryProfileEmailButton from "@/components/admin/RetryProfileEmailButton";
import ApplicationHistory from "@/components/admin/application/ApplicationHistory";
import HiringPanel from "@/components/admin/application/HiringPanel";
import OtherApplications from "@/components/admin/application/OtherApplications";
import {
  APPLICATION_STATUS_BADGE,
  CANDIDATE_STATUS_BADGE,
  badgeFor,
} from "@/components/admin/status-labels";
import { cardClass, primaryButtonClass, secondaryLinkClass } from "@/components/admin/styles";
import { formatDate } from "@/components/admin/tables/format";
import { getApplication, type ApplicationDetail } from "@/lib/admin/queries";
import { toZonedInputValue } from "@/lib/datetime";
import { remainingPositions } from "@/lib/jobs/capacity";
import { INTERVIEW_STATUSES, isEmployerInterviewStage, type InterviewStatus } from "@/schemas/AdminSchemas";

export const metadata: Metadata = { title: "Candidate profile" };

const sectionTitle = "font-heading text-base font-semibold text-ink";
const divided = "border-t border-line pt-5";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold tracking-wider text-gray-2 uppercase">{label}</dt>
      <dd className="text-sm break-words text-ink">{children}</dd>
    </div>
  );
}

export default async function CandidateProfilePage({ params }: PageProps<"/admin/candidates/[id]">) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();
  const name = `${application.candidate.firstName} ${application.candidate.lastName}`;

  return (
    <>
      <PageHeader
        title={name}
        description={`Applied for ${application.job.title} on ${formatDate(application.createdAt)}`}
        actions={
          <>
            <Link href="/admin/candidates" className={secondaryLinkClass}>
              <ArrowLeft aria-hidden="true" /> Back
            </Link>
            <a
              href={`/admin/candidates/${application.id}/cv`}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryButtonClass}
            >
              <ExternalLink aria-hidden="true" /> Open CV
            </a>
          </>
        }
      />

      <div className="grid max-w-5xl gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <ProfileCard application={application} name={name} />
          <section className={`${cardClass} flex flex-col gap-5 p-5 sm:p-6`}>
            {application.viewerIsClient ? (
              <>
                <h2 className={sectionTitle}>Employer interview</h2>
                <InterviewSection application={application} />
              </>
            ) : (
              <>
                <h2 className={sectionTitle}>Employer feedback</h2>
                <EmployerFeedbackSummary application={application} />
              </>
            )}
          </section>
          {/* The pipeline before submission, and who moved it, stays with the agency. */}
          {!application.viewerIsClient && (
            <section className={`${cardClass} flex flex-col gap-4 p-5 sm:p-6`}>
              <h2 className={sectionTitle}>History</h2>
              <ApplicationHistory events={application.events} />
            </section>
          )}
        </div>
        <ApplicationAside application={application} name={name} />
      </div>
    </>
  );
}

function ProfileCard({ application, name }: { application: ApplicationDetail; name: string }) {
  const { candidate } = application;
  const availability = badgeFor(CANDIDATE_STATUS_BADGE, candidate.status);
  return (
    <section className={`${cardClass} flex flex-col gap-5 p-5 sm:p-6`}>
      <h2 className={sectionTitle}>Contact</h2>
      <dl className="grid gap-5 sm:grid-cols-2">
        <Detail label="Email">
          <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-2 hover:underline">
            <Mail className="size-4 text-gray-2" aria-hidden="true" /> {candidate.email}
          </a>
        </Detail>
        <Detail label="Phone">
          <a href={`tel:${candidate.phone}`} className="inline-flex items-center gap-2 hover:underline">
            <Phone className="size-4 text-gray-2" aria-hidden="true" /> {candidate.phone}
          </a>
        </Detail>
        <Detail label="LinkedIn">
          {candidate.linkedin ? (
            <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {candidate.linkedin}
            </a>
          ) : (
            <span className="text-gray-2/60">Not provided</span>
          )}
        </Detail>
        <Detail label="Availability">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={availability.tone}>{availability.label}</StatusBadge>
            <AdminOnly>
              <CandidateAvailabilitySelect candidateId={candidate.id} status={candidate.status} name={name} />
            </AdminOnly>
          </div>
        </Detail>
      </dl>

      <h2 className={`${divided} ${sectionTitle}`}>Cover letter</h2>
      {application.coverLetter ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink">{application.coverLetter}</p>
      ) : (
        <p className="text-sm text-gray-2/60">No cover letter provided.</p>
      )}

      <div className={divided}>
        <AdminOnly
          fallback={
            <>
              <h2 className={`${sectionTitle} mb-3`}>Pre-screening interview notes</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink">
                {application.screeningNotes ?? <span className="text-gray-2/60">None yet.</span>}
              </p>
            </>
          }
        >
          <CandidateScreeningNotesForm applicationId={application.id} initialNotes={application.screeningNotes} />
        </AdminOnly>
      </div>
    </section>
  );
}

const interviewStatus = (value: string): InterviewStatus =>
  (INTERVIEW_STATUSES as readonly string[]).includes(value) ? (value as InterviewStatus) : "not_scheduled";

/**
 * The employer's own interview form, shown only to the client's users, and only
 * while the application is with them (not after the agency moved it back).
 */
function InterviewSection({ application }: { application: ApplicationDetail }) {
  if (!isEmployerInterviewStage(application.status)) {
    return (
      <>
        <p className="text-sm text-gray-2">
          This application is no longer with you (moved back by the agency or cancelled), so the interview
          can&apos;t be changed.
        </p>
        <EmployerFeedbackSummary application={application} />
      </>
    );
  }
  return (
    <InterviewForm
      applicationId={application.id}
      initial={{
        interviewStatus: interviewStatus(application.interviewStatus),
        interviewAt: application.interviewAt ? toZonedInputValue(application.interviewAt) : "",
        interviewNotes: application.interviewNotes ?? "",
        employerFeedback: application.employerFeedback ?? "",
      }}
    />
  );
}

/** Read-only for the agency: what the employer wrote after the interview. */
function EmployerFeedbackSummary({ application }: { application: ApplicationDetail }) {
  const text = (value: string | null) =>
    value ? <span className="whitespace-pre-wrap">{value}</span> : <span className="text-gray-2/60">None yet</span>;
  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      <Detail label="Employer feedback">{text(application.employerFeedback)}</Detail>
      <Detail label="Interview notes">{text(application.interviewNotes)}</Detail>
    </dl>
  );
}

function ApplicationAside({ application, name }: { application: ApplicationDetail; name: string }) {
  const { job } = application;
  const badge = badgeFor(APPLICATION_STATUS_BADGE, application.status);
  const remaining = remainingPositions(job);
  return (
    <aside className="flex h-fit flex-col gap-6">
      <section className={`${cardClass} flex flex-col gap-5 p-5 sm:p-6`}>
        <h2 className={sectionTitle}>Application</h2>
        <dl className="flex flex-col gap-5">
          <Detail label="Job">
            <AdminOnly
              fallback={
                <Link href={`/admin/candidates?job=${job.id}`} className="font-medium hover:underline">
                  {job.title}
                </Link>
              }
            >
              <Link href={`/admin/jobs/${job.id}/edit`} className="font-medium hover:underline">
                {job.title}
              </Link>
            </AdminOnly>
            <span className="block text-xs text-gray-2">
              {job.city.name} · {job.filledPositions}/{job.totalPositions} filled, {remaining} remaining
              {job.status === "closed" && " (job closed)"}
            </span>
          </Detail>
          <Detail label="Status">
            <div className="flex flex-col items-start gap-2">
              <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
              <AdminOnly>
                <ApplicationStatusSelect id={application.id} status={application.status} name={name} />
              </AdminOnly>
            </div>
          </Detail>
          <Detail label="Applied">
            <time dateTime={application.createdAt.toISOString()}>{formatDate(application.createdAt)}</time>
          </Detail>
          <ClientEmailDetail application={application} />
        </dl>
      </section>

      {application.viewerCanManage && (
        <section className={`${cardClass} flex flex-col gap-4 p-5 sm:p-6`}>
          <h2 className={sectionTitle}>Hiring decision</h2>
          <HiringPanel application={application} />
        </section>
      )}

      {/* Other applications name other clients' jobs. */}
      {!application.viewerIsClient && (
        <section className={`${cardClass} flex flex-col gap-4 p-5 sm:p-6`}>
          <h2 className={sectionTitle}>Other applications</h2>
          <OtherApplications applications={application.candidate.applications} />
        </section>
      )}
    </aside>
  );
}

/** Whether the profile went to the client; shown once the application was submitted. */
function ClientEmailDetail({ application }: { application: ApplicationDetail }) {
  if (application.status !== "submitted" && !application.clientProfileEmailSentAt) return null;
  return (
    <Detail label="Client email">
      {application.clientProfileEmailSentAt ? (
        <time dateTime={application.clientProfileEmailSentAt.toISOString()}>
          Sent {formatDate(application.clientProfileEmailSentAt)}
        </time>
      ) : (
        <AdminOnly fallback={<span className="text-gray-2">Not sent</span>}>
          <div className="flex flex-col items-start gap-2">
            <span className="text-amber-700">Not sent yet</span>
            <RetryProfileEmailButton applicationId={application.id} />
          </div>
        </AdminOnly>
      )}
    </Detail>
  );
}
