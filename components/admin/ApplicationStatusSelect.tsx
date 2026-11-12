"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { updateApplicationStatus } from "@/lib/admin/actions/applications";
import { MANUAL_APPLICATION_STATUSES } from "@/schemas/AdminSchemas";
import { APPLICATION_STATUS_BADGE, badgeFor } from "./status-labels";

/**
 * Inline pipeline editor for an application. Hired is final (set by the hire
 * action), so it shows no menu; cancelled shows as the current, unpickable value.
 */
export default function ApplicationStatusSelect({
  id,
  status,
  name,
}: {
  id: string;
  status: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();
  const requestInFlight = useRef(false);
  if (status === "hired") return null;
  const isManual = (MANUAL_APPLICATION_STATUSES as readonly string[]).includes(status);

  return (
    <select
      aria-label={`Status for ${name}`}
      value={status}
      disabled={pending}
      onChange={(e) => {
        if (requestInFlight.current) return;
        const next = e.target.value;
        requestInFlight.current = true;
        startTransition(async () => {
          try {
            const result = await updateApplicationStatus(id, next);
            if (result.error) toast.error(result.error);
            else if (result.notice) toast.warning(result.notice);
            else toast.success(`Marked as ${badgeFor(APPLICATION_STATUS_BADGE, next).label.toLowerCase()}.`);
          } catch {
            toast.error("Could not update the application status. Please try again.");
          } finally {
            requestInFlight.current = false;
          }
        });
      }}
      className="h-9 cursor-pointer rounded-full border border-line bg-white px-3 text-xs font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
    >
      {!isManual && (
        <option value={status} disabled>
          {badgeFor(APPLICATION_STATUS_BADGE, status).label}
        </option>
      )}
      {MANUAL_APPLICATION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {APPLICATION_STATUS_BADGE[s].label}
        </option>
      ))}
    </select>
  );
}
