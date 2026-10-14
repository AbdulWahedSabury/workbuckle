"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { clearFlashCookie, type Flash } from "@/lib/admin/flash";

/** Shows the toast a Server Action queued with setFlash(), once. */
export default function FlashToaster({ flash }: { flash: Flash | null }) {
  useEffect(() => {
    if (!flash) return;
    document.cookie = clearFlashCookie;
    // Same id → sonner updates rather than duplicates (Strict Mode, re-renders).
    toast[flash.type](flash.message, { id: flash.id });
  }, [flash]);

  return null;
}
