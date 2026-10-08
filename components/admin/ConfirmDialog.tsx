"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AlertTriangle, LoaderCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconButtonClass, primaryButtonClass, secondaryButtonClass } from "./styles";

type Tone = "danger" | "default";

const TONES: Record<Tone, { icon: string; confirm: string }> = {
  danger: {
    icon: "bg-red-50 text-red-600 ring-red-200",
    // gray-3 is near-white in light mode and near-black in dark, where red-600 turns light.
    confirm: "bg-red-600 text-gray-3 hover:bg-red-700 focus-visible:ring-red-600",
  },
  default: {
    icon: "bg-primary/10 text-primary-dark ring-primary/20",
    confirm: "",
  },
};

/**
 * Modal confirmation built on the native <dialog>, so focus trapping, Esc and
 * the top layer come from the browser. Controlled: the parent owns `open` and
 * runs the work in `onConfirm`; while `pending`, the dialog can't be dismissed.
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  pending = false,
  icon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  pending?: boolean;
  /** Replaces the default warning icon. */
  icon?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const t = TONES[tone];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Destructive by default lands on the safe choice.
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const dismiss = () => {
    if (!pending) onOpenChange(false);
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(e) => {
        // Esc: let React state drive the close.
        e.preventDefault();
        dismiss();
      }}
      onClose={() => open && onOpenChange(false)}
      onClick={(e) => {
        // A click on the <dialog> itself (not the panel) is a backdrop click.
        if (e.target === e.currentTarget) dismiss();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-md overflow-visible bg-transparent p-0 text-left",
        // Enter/exit: fade + lift, including the backdrop.
        "translate-y-2 scale-95 opacity-0 transition-[opacity,translate,scale,overlay,display] transition-discrete duration-200 ease-out",
        "open:translate-y-0 open:scale-100 open:opacity-100",
        "starting:open:translate-y-2 starting:open:scale-95 starting:open:opacity-0",
        "backdrop:bg-black/0 backdrop:backdrop-blur-none backdrop:transition-[background-color,backdrop-filter,overlay,display] backdrop:transition-discrete backdrop:duration-200",
        "open:backdrop:bg-black/50 open:backdrop:backdrop-blur-[3px]",
        "starting:open:backdrop:bg-black/0 starting:open:backdrop:backdrop-blur-none",
        "motion-reduce:transition-none motion-reduce:backdrop:transition-none"
      )}
    >
      <div className="relative rounded-sm-card border border-line bg-white p-6 shadow-2xl shadow-black/20 sm:p-7">
        <button
          type="button"
          onClick={dismiss}
          disabled={pending}
          aria-label="Close"
          className={cn(iconButtonClass, "absolute top-3 right-3 size-8 disabled:opacity-50")}
        >
          <X aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-full ring-8 [&_svg]:size-5",
              t.icon
            )}
          >
            {icon ?? <AlertTriangle />}
          </span>
          <div className="flex min-w-0 flex-col gap-1.5 sm:pt-1 sm:pr-6">
            <h2 id={titleId} className="font-heading text-lg text-ink">
              {title}
            </h2>
            {description && (
              <div id={descriptionId} className="text-sm leading-relaxed font-normal text-gray-2 [&_strong]:font-semibold [&_strong]:text-ink">
                {description}
              </div>
            )}
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={dismiss}
            disabled={pending}
            className={secondaryButtonClass}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending}
            className={cn(primaryButtonClass, t.confirm)}
          >
            {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
