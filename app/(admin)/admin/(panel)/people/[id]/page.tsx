import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, Phone } from "lucide-react";
import AdminOnly from "@/components/admin/AdminOnly";
import AssignToJobForm from "@/components/admin/AssignToJobForm";
import CandidateAvailabilitySelect from "@/components/admin/CandidateAvailabilitySelect";
import PageHeader from "@/components/admin/PageHeader";
import PersonPositionsForm from "@/components/admin/PersonPositionsForm";
import StatusBadge from "@/components/admin/StatusBadge";
import { APPLICATION_STATUS_BADGE, CANDIDATE_STATUS_BADGE, badgeFor } from "@/components/admin/status-labels";
import { cardClass, primaryButtonClass, secondaryLinkClass } from "@/components/admin/styles";
import { formatDate } from "@/components/admin/tables/format";
import { assignToJob } from "@/lib/admin/actions/candidates";
import { viewerCanEdit } from "@/lib/admin/auth";
import { getAssignableJobOptions, getPerson, getPositionOptions, type PersonDetail } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Candidate" };

const sectionTitle = "font-heading text-base font-semibold text-ink";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold tracking-wider text-gray-2 uppercase">{label}</dt>
      <dd className="text-sm break-words text-ink">{children}</dd>
    </div>
  );
}

export default async function PersonPage({ params }: PageProps<"/admin/people/[id]">) {
  const { id } = await params;
  const [person, positionOptions] = await Promise.all([getPerson(id), getPositionOptions()]);
  if (!person) notFound();
  const name = `${person.firstName} ${person.lastName}`;
  const availability = badgeFor(CANDIDATE_STATUS_BADGE, person.status);

  return (
    <>
      <PageHeader
        title={name}
        description={`In the talent pool since ${formatDate(person.createdAt)}`}
        actions={
          <>
            <Link href="/admin/people" className={secondaryLinkClass}>
              <ArrowLeft aria-hidden="true" /> Talent pool
            </Link>
            {person.cvUrl && (
              <a href={`/admin/people/${person.id}/cv`} target="_blank" rel="noopener noreferrer" className={primaryButtonClass}>
                <ExternalLink aria-hidden="true" /> Open CV
              </a>
            )}
          </>
        }
      />

      <div className="grid max-w-5xl gap-6 lg:grid-cols-3">
        <section className={`${cardClass} flex flex-col gap-5 p-5 sm:p-6 lg:col-span-2`}>
          <h2 className={sectionTitle}>Contact</h2>
          <dl className="grid gap-5 sm:grid-cols-2">
            <Detail label="Email">
              <a href={`mailto:${person.email}`} className="inline-flex items-center gap-2 hover:underline">
                <Mail className="size-4 text-gray-2" aria-hidden="true" /> {person.email}
              </a>
            </Detail>
            <Detail label="Phone">
              <a href={`tel:${person.phone}`} className="inline-flex items-center gap-2 hover:underline">
                <Phone className="size-4 text-gray-2" aria-hidden="true" /> {person.phone}
              </a>
            </Detail>
            <Detail label="LinkedIn">
              {person.linkedin ? (
                <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {person.linkedin}
                </a>
              ) : (
                <span className="text-gray-2/60">Not provided</span>
              )}
            </Detail>
            <Detail label="Availability">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={availability.tone}>{availability.label}</StatusBadge>
                <AdminOnly>
                  <CandidateAvailabilitySelect candidateId={person.id} status={person.status} name={name} />
                </AdminOnly>
              </div>
            </Detail>
          </dl>

          <h2 className={`border-t border-line pt-5 ${sectionTitle}`}>Positions</h2>
          <AdminOnly fallback={<PositionList positions={person.positions} />}>
            <PersonPositionsForm
              candidateId={person.id}
              options={positionOptions}
              selected={person.positions.map(({ position }) => position.id)}
            />
          </AdminOnly>

          <h2 className={`border-t border-line pt-5 ${sectionTitle}`}>Applications</h2>
          <Applications applications={person.applications} />
        </section>

        <AdminOnly>
          <section className={`${cardClass} flex h-fit flex-col gap-4 p-5 sm:p-6`}>
            <h2 className={sectionTitle}>Assign to a job</h2>
            <AssignPanel person={person} />
          </section>
        </AdminOnly>
      </div>
    </>
  );
}

/** Read-only for viewers. */
function PositionList({ positions }: { positions: PersonDetail["positions"] }) {
  if (!positions.length) return <p className="text-sm text-gray-2/60">No positions yet.</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {positions.map(({ position }) => (
        <li key={position.id} className="rounded-full border border-line px-3 py-1 text-sm text-ink">
          {position.name}
        </li>
      ))}
    </ul>
  );
}

function Applications({ applications }: { applications: PersonDetail["applications"] }) {
  if (!applications.length) return <p className="text-sm text-gray-2/60">Not assigned to any job yet.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {applications.map((app) => {
        const badge = badgeFor(APPLICATION_STATUS_BADGE, app.status);
        return (
          <li key={app.id}>
            <Link
              href={`/admin/candidates/${app.id}`}
              className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-gray-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{app.job.title}</span>
                <span className="block text-xs text-gray-2">
                  {app.job.client.name} · {formatDate(app.createdAt)}
                </span>
              </span>
              <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Only open candidates with a CV can be put forward; the form explains otherwise. */
async function AssignPanel({ person }: { person: PersonDetail }) {
  if (!(await viewerCanEdit())) return null;
  if (person.status === "hired") return <p className="text-sm text-gray-2">Hired candidates can&rsquo;t be assigned to other jobs.</p>;
  if (person.status === "inactive") return <p className="text-sm text-gray-2">Set them back to open to assign them to a job.</p>;
  if (!person.cvUrl) return <p className="text-sm text-gray-2">This candidate has no CV on file yet.</p>;
  const jobs = await getAssignableJobOptions(person.id);
  return <AssignToJobForm action={assignToJob.bind(null, person.id)} jobs={jobs} />;
}
