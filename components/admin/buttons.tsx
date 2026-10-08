"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { DeleteResult } from "@/lib/admin/action-state";
import { cn } from "@/lib/utils";
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
 * Delete with a browser confirm. `action` should already be bound to the row
 * id; if it returns `{ error }`, that is shown as a toast.
 */
export function DeleteButton({
  action,
  confirmMessage,
  label = "Delete",
  disabledReason,
}: {
  action: () => Promise<void | DeleteResult>;
  confirmMessage: string;
  /** Accessible name, e.g. `Delete "Limassol"`. */
  label?: string;
  /** When set, the button is disabled and this explains why. */
  disabledReason?: string;
}) {
  return (
    <form
      action={async () => {
        const result = await action();
        if (result?.error) toast.error(result.error);
      }}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <DeleteSubmit label={label} disabledReason={disabledReason} />
    </form>
  );
}

function DeleteSubmit({ label, disabledReason }: { label: string; disabledReason?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || Boolean(disabledReason)}
      aria-label={disabledReason ? `${label} (${disabledReason})` : label}
      title={disabledReason ?? label}
      className={cn(iconButtonClass, "hover:bg-red-50 hover:text-red-700 disabled:opacity-50")}
    >
      {pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
    </button>
  );
}
