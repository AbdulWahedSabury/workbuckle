"use client";

import { useState } from "react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { ImageOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldShell, inputClass, type BaseProps } from "./fields";

const VALID_ICONS = new Set<string>(iconNames);
const MAX_RESULTS = 48;

/** Shown before anything is typed: icons that suit common job categories. */
const SUGGESTED: readonly string[] = [
  "briefcase",
  "code-xml",
  "laptop",
  "database",
  "stethoscope",
  "heart-pulse",
  "graduation-cap",
  "book-open",
  "calculator",
  "landmark",
  "scale",
  "megaphone",
  "palette",
  "pen-tool",
  "headset",
  "users",
  "shopping-cart",
  "store",
  "truck",
  "plane",
  "chef-hat",
  "utensils",
  "hammer",
  "wrench",
  "hard-hat",
  "factory",
  "building-2",
  "house",
  "leaf",
  "tractor",
  "shield",
  "flask-conical",
].filter((name) => VALID_ICONS.has(name));

function isIconName(name: string): name is IconName {
  return VALID_ICONS.has(name);
}

/**
 * Text input for a Lucide icon name with a live preview and a searchable grid
 * of icons to click. The value is submitted under `name`; empty means "none".
 */
export default function IconPickerField({
  defaultValue,
  ...base
}: BaseProps & { defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const query = value.trim().toLowerCase();
  const valid = isIconName(query);

  const matches = query
    ? iconNames.filter((n) => n.includes(query)).slice(0, MAX_RESULTS)
    : SUGGESTED;

  return (
    <FieldShell {...base}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl ring-1",
            valid ? "bg-primary/10 text-primary ring-primary/15" : "bg-gray-3 text-gray-2/70 ring-transparent"
          )}
        >
          {valid ? (
            <DynamicIcon name={query as IconName} className="size-6" strokeWidth={1.75} />
          ) : (
            <ImageOff className="size-5" />
          )}
        </span>
        <div className="relative flex-1">
          <input
            id={base.name}
            name={base.name}
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search icons, e.g. code, truck, heart"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={base.error?.length || (query && !valid) ? true : undefined}
            aria-describedby={base.error?.length ? `${base.name}-error` : undefined}
            className={cn(inputClass, value && "pr-10")}
          />
          {value && (
            <button
              type="button"
              onClick={() => setValue("")}
              aria-label="Clear icon"
              className="absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-2 hover:bg-ink/5 hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {matches.length ? (
        <div
          role="group"
          aria-label={query ? `Icons matching “${query}”` : "Suggested icons"}
          className="grid grid-cols-6 gap-1.5 rounded-xl bg-gray-3 p-2 sm:grid-cols-8"
        >
          {matches.map((icon) => {
            const selected = icon === query;
            return (
              <button
                key={icon}
                type="button"
                title={icon}
                aria-label={icon}
                aria-pressed={selected}
                onClick={() => setValue(icon)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  selected ? "bg-primary text-on-primary" : "bg-white text-ink hover:bg-primary/10 hover:text-primary"
                )}
              >
                <DynamicIcon name={icon as IconName} className="size-5" strokeWidth={1.75} />
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl bg-gray-3 px-4 py-3 text-xs text-gray-2">No icons match “{query}”.</p>
      )}
    </FieldShell>
  );
}
