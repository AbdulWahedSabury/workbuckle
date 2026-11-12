"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { hireCandidate } from "@/lib/admin/actions/hiring";
import ConfirmDialog from "./ConfirmDialog";
import { primaryButtonClass } from "./styles";

/** The explicit hiring decision, behind a confirmation that spells out every side effect. */
export default function HireButton({
  applicationId,
  candidateName,
  jobTitle,
  remaining,
  otherActive,
  disabledReason,
}: {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  /** Positions left on the job before this hire. */
  remaining: number;
  /** The candidate's other applications that will be cancelled. */
  otherActive: number;
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const confirm = () =>
    startTransition(async () => {
      const result = await hireCandidate(applicationId);
      setOpen(false);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? "Candidate hired.");
        router.refresh();
      }
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending || Boolean(disabledReason)}
        title={disabledReason}
        aria-haspopup="dialog"
        className={primaryButtonClass}
      >
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <BadgeCheck aria-hidden="true" />}
        Mark as hired
      </button>
      {disabledReason && <p className="text-xs text-gray-2">{disabledReason}</p>}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={confirm}
        pending={pending}
        icon={<BadgeCheck />}
        title={`Hire ${candidateName}?`}
        description={
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Fills 1 of the {remaining} remaining {remaining === 1 ? "position" : "positions"} for{" "}
              <strong>{jobTitle}</strong>
              {remaining === 1 ? "; the job then closes automatically." : "."}
            </li>
            <li>{candidateName} becomes hired and can&rsquo;t apply for other jobs.</li>
            {otherActive > 0 && (
              <li>
                Their {otherActive} other active {otherActive === 1 ? "application is" : "applications are"} cancelled.
              </li>
            )}
            <li>This can&rsquo;t be undone from the panel.</li>
          </ul>
        }
        confirmLabel={pending ? "Hiring…" : "Confirm hire"}
      />
    </>
  );
}
