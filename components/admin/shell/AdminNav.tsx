"use client";

import { useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Briefcase,
  BriefcaseBusiness,
  Globe,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/generated/prisma/enums";
import { canView, type AdminSection } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; section: AdminSection; exact?: boolean };
type NavGroup = { label: string; items: readonly NavItem[] };

const NAV_GROUPS: readonly NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, section: "dashboard", exact: true }],
  },
  {
    label: "Recruitment",
    items: [
      { href: "/admin/jobs", label: "Jobs", icon: BriefcaseBusiness, section: "jobs" },
      { href: "/admin/candidates", label: "Candidates", icon: Users, section: "candidates" },
      { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone, section: "campaigns" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/categories", label: "Job categories", icon: Tags, section: "categories" },
      { href: "/admin/job-types", label: "Job types", icon: Briefcase, section: "jobTypes" },
      { href: "/admin/cities", label: "Cities", icon: MapPin, section: "cities" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Site settings", icon: Settings, section: "settings" },
      { href: "/admin/users", label: "Users", icon: ShieldCheck, section: "users" },
    ],
  },
];

function isActive(pathname: string, { href, exact }: NavItem) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

const headingClass = "mb-2 px-4 text-xs font-semibold tracking-wider text-gray-2 uppercase";

function linkClass(active: boolean) {
  return cn(
    "group flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-[background-color,color] duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
    active ? "bg-ink text-white" : "text-gray-2 hover:bg-gray-3 hover:text-ink"
  );
}

function iconClass(active: boolean) {
  return cn("size-4 shrink-0 transition-colors", active ? "text-primary" : "group-hover:text-primary-dark");
}

/**
 * Admin section links, grouped and filtered to what `role` may open. Groups
 * with nothing visible are dropped (EMPLOYER sees only Overview and
 * Recruitment). The active item uses the site's dark pill (see LocationChips).
 */
export default function AdminNav({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  // The sidebar and the mobile drawer each render a nav; keep heading ids unique.
  const idPrefix = useId();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canView(role, item.section)),
  })).filter((group) => group.items.length > 0);

  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      {groups.map((group) => {
        const headingId = `${idPrefix}-${group.label}`;
        return (
          <div key={group.label}>
            <p id={headingId} className={headingClass}>
              {group.label}
            </p>
            <ul aria-labelledby={headingId} className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={linkClass(active)}
                    >
                      <Icon aria-hidden="true" className={iconClass(active)} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <div>
        <p className={headingClass}>Website</p>
        <Link href="/" target="_blank" onClick={onNavigate} className={linkClass(false)}>
          <Globe aria-hidden="true" className={iconClass(false)} />
          <span className="truncate">View live site</span>
          <ArrowUpRight
            aria-hidden="true"
            className="ml-auto size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
          <span className="sr-only">(opens in a new tab)</span>
        </Link>
      </div>
    </nav>
  );
}
