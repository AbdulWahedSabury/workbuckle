import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-sm-card border border-dashed border-ink/15 bg-white px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-gray-3 text-gray-2">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 font-heading text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-2">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
