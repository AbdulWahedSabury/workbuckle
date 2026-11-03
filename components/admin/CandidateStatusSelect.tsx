"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { updateCandidateStatus } from "@/lib/admin/actions/candidates";
import { CANDIDATE_STATUSES } from "@/schemas/AdminSchemas";

const LABELS: Record<string, string> = {
  pending: "Pending",
  Review: "Review",
  "Short list": "Short list",
  submitted: "Submitted",
};

/** Inline status editor for the candidates table. */
export default function CandidateStatusSelect({
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
            const result = await updateCandidateStatus(id, next);
            if (result.error) toast.error(result.error);
            else toast.success(`Marked as ${LABELS[next]?.toLowerCase() ?? next}.`);
          } catch {
            toast.error("Could not update the candidate status. Please try again.");
          } finally {
            requestInFlight.current = false;
          }
        });
      }}
      className="h-9 cursor-pointer rounded-full border border-line bg-white px-3 text-xs font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
    >
      {CANDIDATE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {LABELS[s]}
        </option>
      ))}
    </select>
  );
}
