"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleX, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { rejectApplication } from "@/lib/admin/actions/applications";
import ConfirmDialog from "./ConfirmDialog";
import { secondaryButtonClass } from "./styles";

/** The employer's "no", behind a confirmation. Capacity is never touched. */
export default function RejectButton({ applicationId, candidateName }: { applicationId: string; candidateName: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const confirm = () =>
    startTransition(async () => {
      const result = await rejectApplication(applicationId);
      setOpen(false);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`${candidateName} rejected.`);
        router.refresh();
      }
    });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={pending} aria-haspopup="dialog" className={secondaryButtonClass}>
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <CircleX aria-hidden="true" />}
        Reject
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={confirm}
        pending={pending}
        tone="danger"
        icon={<CircleX />}
        title={`Reject ${candidateName}?`}
        description={<p>The application is marked as rejected. {candidateName} stays available for other jobs.</p>}
        confirmLabel={pending ? "Rejecting…" : "Reject"}
      />
    </>
  );
}
