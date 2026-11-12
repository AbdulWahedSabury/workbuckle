import Link from "next/link";
import type { ApplicationDetail } from "@/lib/admin/queries";
import StatusBadge from "../StatusBadge";
import { APPLICATION_STATUS_BADGE, badgeFor } from "../status-labels";
import { formatDate } from "../tables/format";

type Other = ApplicationDetail["candidate"]["applications"][number];

/** The same person's applications for other jobs. */
export default function OtherApplications({ applications }: { applications: Other[] }) {
  if (!applications.length) {
    return <p className="text-sm text-gray-2/60">No other applications.</p>;
  }
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
                <span className="block text-xs text-gray-2">Applied {formatDate(app.createdAt)}</span>
              </span>
              <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
