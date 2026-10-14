"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";

/**
 * Toasts a failed form submit. Successes redirect or re-render with a
 * setFlash() toast instead, so any message or field error here is a failure.
 */
export function useActionErrorToast(state: ActionState) {
  useEffect(() => {
    if (state === initialActionState) return;
    const hasFieldErrors = Object.values(state.errors ?? {}).some((e) => e?.length);
    if (state.message) toast.error(state.message);
    else if (hasFieldErrors) toast.error("Please fix the highlighted fields.");
  }, [state]);
}
