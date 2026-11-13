import Link from "next/link";
import AdminOnly from "@/components/admin/AdminOnly";
import ApplicationStatusSelect from "@/components/admin/ApplicationStatusSelect";
import { DeleteButton } from "@/components/admin/buttons";
import StatusBadge from "@/components/admin/StatusBadge";
import { APPLICATION_STATUS_BADGE, badgeFor } from "@/components/admin/status-labels";
import { formatDate } from "@/components/admin/tables/format";
import { deleteApplication } from "@/lib/admin/actions/applications";
import type { JobMatchDetail } from "@/lib/matching/queries";

type Application = JobMatchDetail["applications"][number];

/** Everyone with an application for the job, newest first, with inline status and unassign. */
export default function AssignedCandidates({ applications, jobTitle }: { applications: Application[]; jobTitle: string }) {
  if (!applications.length) {
    return <p className="text-sm text-gray-2/60">Nobody is assigned to this job yet.</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {applications.map((app) => (
        <AssignedRow key={app.id} app={app} jobTitle={jobTitle} />
      ))}
    </ul>
  );
}

function AssignedRow({ app, jobTitle }: { app: Application; jobTitle: string }) {
  const { candidate } = app;
  const name = `${candidate.firstName} ${candidate.lastName}`;
  const badge = badgeFor(APPLICATION_STATUS_BADGE, app.status);
  return (
    <li className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <Link href={`/admin/candidates/${app.id}`} className="font-semibold text-ink hover:underline">
          {name}
        </Link>
        <p className="truncate text-xs text-gray-2">
          {candidate.email} · {candidate.phone} · Assigned {formatDate(app.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <AdminOnly fallback={<StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>}>
          {app.status === "hired" ? (
            <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
          ) : (
            <>
              <ApplicationStatusSelect id={app.id} status={app.status} name={name} />
              <DeleteButton
                action={deleteApplication.bind(null, app.id)}
                title="Unassign this candidate?"
                description={
                  <>
                    <strong>{name}</strong>&rsquo;s application for {jobTitle} will be deleted. They stay in
                    the talent pool with their CV.
                  </>
                }
                label={`Unassign ${name}`}
                successMessage="Candidate unassigned."
              />
            </>
          )}
        </AdminOnly>
      </div>
    </li>
  );
}
