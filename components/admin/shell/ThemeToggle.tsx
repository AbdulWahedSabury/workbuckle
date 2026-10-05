"use client";

import { useId } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminTheme } from "@/lib/admin/theme";
import { useAdminTheme } from "./AdminThemeProvider";

const OPTIONS: readonly { value: AdminTheme; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * Light / Dark / System segmented control. Native radios give arrow-key
 * navigation and the right semantics; the inputs are visually hidden and the
 * label carries the focus ring.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useAdminTheme();
  // Sidebar and mobile drawer each render one; radios group by name page-wide.
  const name = useId();

  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-2 px-4 text-xs font-semibold tracking-wider text-gray-2 uppercase">
        Theme
      </legend>
      <div className="grid grid-cols-3 gap-1 rounded-full bg-gray-3 p-1">
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const checked = theme === value;
          return (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 py-2 text-xs font-semibold transition-[background-color,color] duration-200 has-focus-visible:ring-2 has-focus-visible:ring-primary",
                checked ? "bg-white text-ink shadow-sm" : "text-gray-2 hover:text-ink"
              )}
            >
              <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={() => setTheme(value)}
                className="sr-only"
              />
              <Icon aria-hidden="true" className={cn("size-3.5", checked && "text-primary-dark")} />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
