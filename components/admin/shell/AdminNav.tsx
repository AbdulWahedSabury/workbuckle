"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, LayoutDashboard, MapPin, Settings, Tags, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/categories", label: "Job categories", icon: Tags },
  { href: "/admin/job-types", label: "Job types", icon: Briefcase },
  { href: "/admin/cities", label: "Cities", icon: MapPin },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
];

function isActive(pathname: string, { href, exact }: NavItem) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Admin section links. The active item uses the site's dark pill (see JobFilterTabs). */
export default function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin">
      <p className="mb-2 px-4 text-xs font-semibold tracking-wider text-gray-2 uppercase">
        Manage
      </p>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-[background-color,color] duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  active ? "bg-ink text-white" : "text-gray-2 hover:bg-gray-3 hover:text-ink"
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-4 transition-colors",
                    active ? "text-primary" : "group-hover:text-primary-dark"
                  )}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
