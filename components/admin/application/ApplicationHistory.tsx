import type { ApplicationDetail } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/datetime";
import { APPLICATION_STATUS_BADGE, INTERVIEW_STATUS_LABELS, badgeFor } from "../status-labels";

type Event = ApplicationDetail["events"][number];

function label(event: Event, value: string): string {
  if (event.field === "interview") {
    return (INTERVIEW_STATUS_LABELS as Record<string, string | undefined>)[value] ?? value;
  }
  return badgeFor(APPLICATION_STATUS_BADGE, value).label;
}

function describe(event: Event): string {
  const what = event.field === "interview" ? "Interview" : "Status";
  const to = label(event, event.toValue);
  return event.fromValue ? `${what}: ${label(event, event.fromValue)} → ${to}` : `${what}: ${to}`;
}

/** Newest-first timeline of status and interview changes. */
export default function ApplicationHistory({ events }: { events: Event[] }) {
  if (!events.length) {
    return <p className="text-sm text-gray-2/60">No changes recorded yet.</p>;
  }
  return (
    <ol className="flex flex-col gap-3">
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-0.5 border-l-2 border-line pl-3">
          <span className="text-sm font-medium text-ink">{describe(event)}</span>
          {event.note && <span className="text-xs text-gray-2">{event.note}</span>}
          <span className="text-xs text-gray-2">
            <time dateTime={event.createdAt.toISOString()}>{formatDateTime(event.createdAt)}</time>
            {" · "}
            {event.actor ? (event.actor.name ?? event.actor.email) : "Automatic"}
          </span>
        </li>
      ))}
    </ol>
  );
}
