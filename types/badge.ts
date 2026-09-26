import type { LucideIcon } from "lucide-react";

export type BadgeTone = "light" | "dark" | "primary";

export type Badge = {
  icon: LucideIcon;
  label: readonly [string, string];
  tone: BadgeTone;
};