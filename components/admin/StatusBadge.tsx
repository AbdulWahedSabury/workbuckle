import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "neutral" | "brand" | "danger";

const TONES: Record<StatusTone, { badge: string; dot: string }> = {
  success: { badge: "bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  neutral: { badge: "bg-gray-900 text-gray-100", dot: "bg-gray-2/50" },
  brand: { badge: "bg-primary text-gray-100", dot: "bg-primary" },
  danger: { badge: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

/** Pill label with a status dot, matching the site's tag pills. */
export default function StatusBadge({
  tone = "neutral",
  dot = true,
  children,
  className,
}: {
  tone?: StatusTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        t.badge,
        className
      )}
    >
      {dot && <span aria-hidden="true" className={cn("size-1.5 rounded-full", t.dot)} />}
      {children}
    </span>
  );
}
