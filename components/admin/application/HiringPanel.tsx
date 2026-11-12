import type { ApplicationDetail } from "@/lib/admin/queries";
import { formatDate } from "../tables/format";
import { ACTIVE_APPLICATION_STATUSES, isEmployerDecisionStage } from "@/schemas/AdminSchemas";
import { JOB_CLOSED_MESSAGE, remainingPositions } from "@/lib/jobs/capacity";
import HireButton from "../HireButton";
import RejectButton from "../RejectButton";

/** Shown to a client user once the agency rejected or moved the application back (EMPLOYER_CLOSED in lib/admin/hiring.ts). */
const EMPLOYER_CLOSED = "The agency rejected or moved this application back. Contact the agency to continue.";

/** Why this application can't be hired right now, if it can't. Mirrors the checks in lib/admin/hiring.ts. */
function hireBlocker(app: ApplicationDetail, remaining: number): string | undefined {
  if (app.status === "cancelled") return "Cancelled: the candidate was hired for another job.";
  if (app.viewerIsClient && !isEmployerDecisionStage(app.status)) return EMPLOYER_CLOSED;
  if (app.candidate.status === "hired") return "This candidate is already hired for another job.";
  if (app.candidate.status === "inactive") return "This candidate is inactive. Set them back to open first.";
  const full = app.job.filledPositions >= app.job.totalPositions;
  if (full) return "All positions are filled. Raise the number of openings on the job first.";
  if (remaining <= 0) return JOB_CLOSED_MESSAGE; // closed by hand with openings left
  return undefined;
}

/** The final decision: hire or reject. For admins and the client's own users (see requireApplicationManager). */
export default function HiringPanel({ application }: { application: ApplicationDetail }) {
  const { job, candidate } = application;
  const remaining = remainingPositions(job);

  if (application.status === "hired") {
    return (
      <p className="text-sm text-emerald-800">
        Hired{application.hiredAt ? ` on ${formatDate(application.hiredAt)}` : ""}.
      </p>
    );
  }

  const otherActive = candidate.applications.filter((a) =>
    (ACTIVE_APPLICATION_STATUSES as readonly string[]).includes(a.status)
  ).length;

  // Only an application still in the running can be rejected; a client only while it is with them.
  // An admin can still hire a rejected one; a client can't.
  const canReject =
    (ACTIVE_APPLICATION_STATUSES as readonly string[]).includes(application.status) &&
    (!application.viewerIsClient || isEmployerDecisionStage(application.status));

  return (
    <div className="flex flex-col items-start gap-2">
      <HireButton
        applicationId={application.id}
        candidateName={`${candidate.firstName} ${candidate.lastName}`}
        jobTitle={job.title}
        remaining={remaining}
        otherActive={otherActive}
        disabledReason={hireBlocker(application, remaining)}
      />
      {canReject && <RejectButton applicationId={application.id} candidateName={`${candidate.firstName} ${candidate.lastName}`} />}
    </div>
  );
}
