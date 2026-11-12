"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setCandidateStatus } from "@/lib/admin/actions/candidates";

/** Open ↔ inactive for the person. Hired is set by hiring and has no menu. */
export default function CandidateAvailabilitySelect({
  candidateId,
  status,
  name,
}: {
  candidateId: string;
  status: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();
  if (status === "hired") return null;

  return (
    <select
      aria-label={`Availability for ${name}`}
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          const result = await setCandidateStatus(candidateId, next);
          if (result.error) toast.error(result.error);
          else toast.success(next === "inactive" ? "Candidate deactivated." : "Candidate is open again.");
        });
      }}
      className="h-9 cursor-pointer rounded-full border border-line bg-white px-3 text-xs font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
    >
      <option value="open">Open</option>
      <option value="inactive">Inactive</option>
    </select>
  );
}
