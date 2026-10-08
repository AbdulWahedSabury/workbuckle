"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { DeleteResult } from "@/lib/admin/action-state";
import { cn } from "@/lib/utils";
import ConfirmDialog from "./ConfirmDialog";
import { iconButtonClass, primaryButtonClass } from "./styles";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButtonClass}>
      {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

/**
 * Row delete behind a confirmation modal. `action` should already be bound to
 * the row id; if it returns `{ error }`, that is shown as a toast.
 */
export function DeleteButton({
  action,
  title,
  description,
  label = "Delete",
  successMessage = "Deleted.",
  disabledReason,
}: {
  action: () => Promise<void | DeleteResult>;
  /** Modal heading, e.g. `Delete this city?`. */
  title: string;
  /** Modal body: what goes away. "This can't be undone." is appended. */
  description: React.ReactNode;
  /** Accessible name, e.g. `Delete "Limassol"`. */
  label?: string;
  successMessage?: string;
  /** When set, the button is disabled and this explains why. */
  disabledReason?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await action();
      setOpen(false);
      if (result?.error) toast.error(result.error);
      else toast.success(successMessage);
    });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending || Boolean(disabledReason)}
        aria-label={disabledReason ? `${label} (${disabledReason})` : label}
        aria-haspopup="dialog"
        title={disabledReason ?? label}
        className={cn(iconButtonClass, "hover:bg-red-50 hover:text-red-700 disabled:opacity-50")}
      >
        {pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={confirm}
        pending={pending}
        tone="danger"
        icon={<Trash2 />}
        title={title}
        description={
          <>
            <p>{description}</p>
            <p className="mt-2">This can&rsquo;t be undone.</p>
          </>
        }
        confirmLabel={pending ? "Deleting…" : "Delete"}
      />
    </>
  );
}
