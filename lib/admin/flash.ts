// One-shot toast carried across a Server Action (and its redirect) in a
// cookie. Shared by the server layout (reads it) and the client toaster
// (shows it, then clears it). Actions set it with setFlash() from flash-server.ts.

export const FLASH_TYPES = ["success", "error", "info"] as const;

export type FlashType = (typeof FLASH_TYPES)[number];

/** `id` is unique per action, so the same message twice still toasts twice. */
export type Flash = { id: string; type: FlashType; message: string };

export const FLASH_COOKIE = "admin-flash";

/** Scoped to /admin so the public site never receives it. */
export const FLASH_COOKIE_PATH = "/admin";

/** Null for a missing or malformed cookie. */
export function parseFlash(value: string | undefined): Flash | null {
  if (!value) return null;
  try {
    const flash = JSON.parse(value) as Partial<Flash>;
    if (
      typeof flash.id === "string" &&
      typeof flash.message === "string" &&
      FLASH_TYPES.includes(flash.type as FlashType)
    ) {
      return flash as Flash;
    }
  } catch {}
  return null;
}

/** document.cookie string that deletes the flash cookie. */
export const clearFlashCookie = `${FLASH_COOKIE}=; path=${FLASH_COOKIE_PATH}; max-age=0; SameSite=Lax`;
