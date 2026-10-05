"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle, Trash2 } from "lucide-react";
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

/** Delete with a browser confirm. `action` should already be bound to the row id. */
export function DeleteButton({
  action,
  confirmMessage,
  label = "Delete",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  /** Accessible name, e.g. `Delete "Limassol"`. */
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <DeleteSubmit label={label} />
    </form>
  );
}

function DeleteSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      title={label}
      className={cn(iconButtonClass, "hover:bg-red-50 hover:text-red-700 disabled:opacity-50")}
    >
      {pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
    </button>
  );
}
