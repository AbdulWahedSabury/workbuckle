"use client";

import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";

const FALLBACK_ICON: IconName = "briefcase";
const VALID_ICONS = new Set<string>(iconNames);

function resolveIcon(icon: string | null | undefined): IconName {
  return icon && VALID_ICONS.has(icon) ? (icon as IconName) : FALLBACK_ICON;
}

/**
 * A category's Lucide icon by name, or a briefcase when none is set or the
 * name is unknown. Client-only because `lucide-react/dynamic` is.
 */
export default function CategoryIcon({
  icon,
  className,
  strokeWidth = 1.75,
}: {
  icon: string | null | undefined;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <DynamicIcon
      name={resolveIcon(icon)}
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
    />
  );
}
