import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, Phone } from "lucide-react";
import AdminOnly from "@/components/admin/AdminOnly";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge, { type StatusTone } from "@/components/admin/StatusBadge";
import CandidateStatusSelect from "@/components/admin/CandidateStatusSelect";
import { cardClass, primaryButtonClass, secondaryLinkClass } from "@/components/admin/styles";
import { formatDate } from "@/components/admin/tables/format";
import { getCandidate } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Candidate profile" };

const STATUS_BADGE: Record<string, { tone: StatusTone; label: string }> = {
  pending: { tone: "neutral", label: "Pending" },
  success: { tone: "success", label: "Success" },
  rejected: { tone: "danger", label: "Rejected" },
};

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold tracking-wider text-gray-2 uppercase">{label}</dt>
      <dd className="text-sm break-words text-ink">{children}</dd>
    </div>
  );
}

export default async function CandidateProfilePage({
  params,
}: PageProps<"/admin/candidates/[id]">) {
  const { id } = await params;
  const candidate = await getCandidate(id);
  if (!candidate) notFound();

  const name = `${candidate.firstName} ${candidate.lastName}`;
  const badge = STATUS_BADGE[candidate.status] ?? {
    tone: "neutral" as const,
    label: candidate.status,
  };

  return (
    <>
      <PageHeader
        title={name}
        description={`Applied for ${candidate.job.title} on ${formatDate(candidate.createdAt)}`}
        actions={
          <>
            <Link href="/admin/candidates" className={secondaryLinkClass}>
              <ArrowLeft aria-hidden="true" /> Back
            </Link>
            <a
              href={candidate.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryButtonClass}
            >
              <ExternalLink aria-hidden="true" /> Open CV
            </a>
          </>
        }
      />

      <div className="grid max-w-4xl gap-6 lg:grid-cols-3">
        <section className={`${cardClass} flex flex-col gap-5 p-5 sm:p-6 lg:col-span-2`}>
          <h2 className="font-heading text-base font-semibold text-ink">Contact</h2>
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
                <a
                  href={candidate.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {candidate.linkedin}
                </a>
              ) : (
                <span className="text-gray-2/60">Not provided</span>
              )}
            </Detail>
          </dl>

          <h2 className="border-t border-line pt-5 font-heading text-base font-semibold text-ink">
            Cover letter
          </h2>
          {candidate.coverLetter ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink">
              {candidate.coverLetter}
            </p>
          ) : (
            <p className="text-sm text-gray-2/60">No cover letter provided.</p>
          )}
        </section>

        <aside className={`${cardClass} flex h-fit flex-col gap-5 p-5 sm:p-6`}>
          <h2 className="font-heading text-base font-semibold text-ink">Application</h2>
          <dl className="flex flex-col gap-5">
            <Detail label="Job">
              <AdminOnly
                fallback={
                  <Link href={`/admin/candidates?job=${candidate.job.id}`} className="font-medium hover:underline">
                    {candidate.job.title}
                  </Link>
                }
              >
                <Link href={`/admin/jobs/${candidate.job.id}/edit`} className="font-medium hover:underline">
                  {candidate.job.title}
                </Link>
              </AdminOnly>
              <span className="block text-xs text-gray-2">{candidate.job.city.name}</span>
            </Detail>
            <Detail label="Status">
              <div className="flex flex-col items-start gap-2">
                <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                <AdminOnly>
                  <CandidateStatusSelect id={candidate.id} status={candidate.status} name={name} />
                </AdminOnly>
              </div>
            </Detail>
            <Detail label="Applied">
              <time dateTime={candidate.createdAt.toISOString()}>{formatDate(candidate.createdAt)}</time>
            </Detail>
          </dl>
        </aside>
      </div>
    </>
  );
}
