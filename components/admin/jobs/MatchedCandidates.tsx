"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Mail, Phone, UserPlus } from "lucide-react";
import { assignMatchedCandidate } from "@/lib/admin/actions/candidates";
import type { MatchedCandidate } from "@/lib/matching/queries";
import { iconButtonClass, secondaryButtonClass } from "@/components/admin/styles";
import MatchBadge from "./MatchBadge";

/**
 * The job's matched candidates, best first. "Assign to job" removes the row at
 * once; the server's revalidation then shows the person under Assigned
 * candidates (or puts the row back, with a toast, if the assignment failed).
 */
export default function MatchedCandidates({
  jobId,
  candidates,
  canAssign,
  assignBlockedReason,
}: {
  jobId: string;
  candidates: MatchedCandidate[];
  /** False for read-only roles: no assign buttons. */
  canAssign: boolean;
  /** Set when the job can't take anyone (closed, or every position filled). */
  assignBlockedReason?: string;
}) {
  const [, startTransition] = useTransition();
  const [visible, removeOptimistically] = useOptimistic(candidates, (list, assignedId: string) =>
    list.filter((c) => c.id !== assignedId)
  );

  const assign = (candidate: MatchedCandidate) =>
    startTransition(async () => {
      removeOptimistically(candidate.id);
      try {
        const result = await assignMatchedCandidate(jobId, candidate.id);
        if (result.error) toast.error(result.error);
        else toast.success(`${candidate.firstName} ${candidate.lastName} assigned to this job.`);
      } catch {
        toast.error("Could not assign the candidate. Please try again.");
      }
    });

  return (
    <ol className="divide-y divide-line">
      {visible.map((c, index) => (
        <li key={c.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start">
          <div className="flex shrink-0 items-center gap-3 sm:w-20 sm:flex-col sm:items-start sm:gap-1">
            <MatchBadge match={c.match} />
            <span className="text-xs text-gray-2">#{index + 1}</span>
          </div>

          <div className="min-w-0 flex-1">
            <Link href={`/admin/people/${c.id}`} className="font-semibold text-ink hover:underline">
              {c.firstName} {c.lastName}
            </Link>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-2">
              <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                <Mail className="size-3.5" aria-hidden="true" /> {c.email}
              </a>
              <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                <Phone className="size-3.5" aria-hidden="true" /> {c.phone}
              </a>
            </div>
            {c.preview && <p className="mt-2 text-sm leading-relaxed text-gray-2">{c.preview}</p>}
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:pt-0.5">
            <a
              href={`/admin/people/${c.id}/cv`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${c.firstName} ${c.lastName}'s CV`}
              title="Open CV"
              className={iconButtonClass}
            >
              <ExternalLink aria-hidden="true" />
            </a>
            {canAssign && (
              <button
                type="button"
                onClick={() => assign(c)}
                disabled={Boolean(assignBlockedReason)}
                title={assignBlockedReason}
                className={`${secondaryButtonClass} h-9 px-4`}
              >
                <UserPlus aria-hidden="true" /> Assign to job
              </button>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
