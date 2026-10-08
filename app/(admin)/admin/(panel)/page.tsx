import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import {
  Briefcase,
  ChevronRight,
  Inbox,
  MapPin,
  Plus,
  Sparkles,
  Tags,
  Trophy,
  Users,
} from "lucide-react";
import ActivityChart from "@/components/admin/dashboard/ActivityChart";
import KpiCard, { KpiGridSkeleton, type KpiCardProps } from "@/components/admin/dashboard/KpiCard";
import Panel, { PanelSkeleton } from "@/components/admin/dashboard/Panel";
import StatusBreakdown from "@/components/admin/dashboard/StatusBreakdown";
import StatusBadge, { type StatusTone } from "@/components/admin/StatusBadge";
import { formatDate } from "@/components/admin/tables/format";
import { requireView } from "@/lib/admin/auth";
import {
  getAdminCounts,
  getCandidateInsights,
  getJobStatusCounts,
  listRecentChanges,
} from "@/lib/admin/queries";
import { canEdit, canView, roleLabel } from "@/lib/auth/roles";

const CANDIDATE_BADGE: Record<string, { tone: StatusTone; label: string }> = {
  pending: { tone: "neutral", label: "Pending" },
  success: { tone: "success", label: "Success" },
  rejected: { tone: "danger", label: "Rejected" },
};

const JOB_BADGE: Record<string, { tone: StatusTone; label: string }> = {
  published: { tone: "success", label: "Published" },
  draft: { tone: "neutral", label: "Draft" },
  closed: { tone: "danger", label: "Closed" },
};

export default async function AdminDashboardPage() {
  const user = await requireView("dashboard");
  const showCatalog = canView(user.role, "categories");

  return (
    <div className="flex flex-col gap-6">
      <Hero name={user.name ?? user.email.split("@")[0]} role={roleLabel(user.role)} canEdit={canEdit(user.role)} />

      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Key metrics
        </h2>
        <Suspense fallback={<KpiGridSkeleton count={showCatalog ? 4 : 2} />}>
          <DashboardMetrics />
        </Suspense>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<PanelSkeleton className="lg:col-span-2" height={340} />}>
          <ApplicationsActivity />
        </Suspense>
        <Suspense fallback={<PanelSkeleton height={340} />}>
          <CandidatePipeline />
        </Suspense>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<PanelSkeleton height={380} />}>
          <LatestApplications />
        </Suspense>
        <Suspense fallback={<PanelSkeleton height={380} />}>
          <JobsOverview />
        </Suspense>
      </div>

      {/* Recent changes lists categories and cities, which not every role can open. */}
      {showCatalog && (
        <Suspense fallback={<PanelSkeleton height={300} />}>
          <RecentChanges />
        </Suspense>
      )}
    </div>
  );
}

function Hero({ name, role, canEdit }: { name: string; role: string; canEdit: boolean }) {
  return (
    // Fixed dark colours rather than theme tokens: the banner looks the same
    // in light and dark mode (`white`/`ink` swap in the admin dark theme).
    <header className="relative isolate overflow-hidden rounded-card bg-[#141414] px-6 py-8 text-[#f6f6f6] sm:px-10 sm:py-10">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <span className="absolute -top-24 -right-10 size-80 rounded-full bg-primary/45 blur-3xl" />
        <span className="absolute -bottom-32 left-1/3 size-72 rounded-full bg-primary/20 blur-3xl" />
        <span className="absolute inset-0 bg-[radial-gradient(#ffffff14_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#ffffff14] px-3 py-1 text-xs font-semibold tracking-wide text-[#f6f6f6]/85 ring-1 ring-[#ffffff1f]">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            {role} dashboard
          </p>
          <h1 className="mt-4 text-3xl text-[#ffffff] sm:text-4xl">
            Welcome back, <span className="text-primary">{name}</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#f6f6f6]/70 sm:text-base">
            Here&apos;s what&apos;s happening with your jobs and applicants.
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/jobs/new"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-[background-color,transform] duration-200 hover:bg-primary-dark active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#141414] focus-visible:outline-none"
            >
              <Plus className="size-4" aria-hidden="true" />
              New job
            </Link>
            <Link
              href="/admin/candidates/new"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#ffffff14] px-5 text-sm font-semibold text-[#ffffff] ring-1 ring-[#ffffff26] transition-[background-color,transform] duration-200 hover:bg-[#ffffff26] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <Users className="size-4" aria-hidden="true" />
              Add candidate
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

async function DashboardMetrics() {
  await connection();
  const { role } = await requireView("dashboard");
  const [counts, insights] = await Promise.all([getAdminCounts(), getCandidateInsights()]);
  const { categories, activeCategories, cities, jobs, publishedJobs, candidates } = counts;
  const showCatalog = canView(role, "categories") && canView(role, "cities");

  const cards: KpiCardProps[] = [
    {
      label: "Total candidates",
      value: candidates,
      icon: Users,
      href: "/admin/candidates",
      featured: true,
      trend: {
        value: insights.thisWeek - insights.lastWeek,
        label: `${insights.thisWeek} in the last 7 days`,
      },
    },
    {
      label: "Jobs",
      value: jobs,
      icon: Briefcase,
      href: "/admin/jobs",
      progress: {
        ratio: jobs ? publishedJobs / jobs : 0,
        label: `${publishedJobs} of ${jobs} jobs published`,
      },
      detail: jobs ? `${publishedJobs} published · ${jobs - publishedJobs} not live` : "No jobs yet",
    },
  ];

  if (showCatalog) {
    cards.push(
      {
        label: "Job categories",
        value: categories,
        icon: Tags,
        href: "/admin/categories",
        progress: {
          ratio: categories ? activeCategories / categories : 0,
          label: `${activeCategories} of ${categories} categories visible`,
        },
        detail:
          categories === activeCategories
            ? "Everything is live"
            : `${categories - activeCategories} hidden from visitors`,
      },
      {
        label: "Cities",
        value: cities,
        icon: MapPin,
        href: "/admin/cities",
        detail: "Locations jobs can be posted in",
      }
    );
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${showCatalog ? "xl:grid-cols-4" : ""}`}>
      {cards.map((card) => (
        <KpiCard key={card.href} {...card} />
      ))}
    </div>
  );
}

async function ApplicationsActivity() {
  await connection();
  const { activity, thisWeek, lastWeek } = await getCandidateInsights();
  const total = activity.reduce((sum, d) => sum + d.count, 0);
  const change = lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;

  return (
    <Panel
      id="activity"
      title="Applications"
      description="New candidates per day, last 14 days"
      action={{ href: "/admin/candidates", label: "All candidates" }}
      className="lg:col-span-2"
    >
      <div className="mb-6 flex flex-wrap gap-x-8 gap-y-3">
        <Figure label="Last 14 days" value={total} />
        <Figure label="This week" value={thisWeek} />
        <Figure
          label="vs. previous week"
          value={change === null ? "—" : `${change > 0 ? "+" : ""}${change}%`}
          tone={change === null || change === 0 ? undefined : change > 0 ? "up" : "down"}
        />
      </div>
      <ActivityChart days={activity} />
    </Panel>
  );
}

function Figure({ label, value, tone }: { label: string; value: number | string; tone?: "up" | "down" }) {
  return (
    <div>
      <p className="text-xs text-gray-2">{label}</p>
      <p
        className={`font-heading text-xl font-semibold tabular-nums ${
          tone === "up" ? "text-emerald-800" : tone === "down" ? "text-red-700" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

async function CandidatePipeline() {
  await connection();
  const { statusCounts } = await getCandidateInsights();
  const href = "/admin/candidates?sort=status&dir=asc";

  return (
    <Panel id="pipeline" title="Candidate pipeline" description="Where every applicant stands">
      <StatusBreakdown
        totalLabel="applicants"
        items={[
          { key: "pending", label: "Pending review", count: statusCounts.pending, color: "bg-amber-400", href },
          { key: "success", label: "Successful", count: statusCounts.success, color: "bg-emerald-500", href },
          { key: "rejected", label: "Rejected", count: statusCounts.rejected, color: "bg-red-500", href },
        ]}
      />
      {statusCounts.pending > 0 && (
        <Link
          href={href}
          className="mt-4 flex items-center gap-3 rounded-2xl bg-primary/10 p-3 text-sm transition-colors hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
            <Inbox className="size-4" aria-hidden="true" />
          </span>
          <span className="flex-1 text-ink">
            <strong className="font-semibold">{statusCounts.pending}</strong> waiting for review
          </span>
          <ChevronRight className="size-4 text-gray-2" aria-hidden="true" />
        </Link>
      )}
    </Panel>
  );
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });

function timeAgo(date: Date, now: number) {
  const minutes = Math.round((date.getTime() - now) / 60_000);
  if (minutes > -60) return relative.format(Math.min(minutes, -1), "minute");
  const hours = Math.round(minutes / 60);
  if (hours > -24) return relative.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (days > -7) return relative.format(days, "day");
  return formatDate(date);
}

async function LatestApplications() {
  await connection();
  const { latest } = await getCandidateInsights();
  const now = Date.now();

  return (
    <Panel
      id="latest"
      title="Latest applications"
      description="The newest candidates to apply"
      action={{ href: "/admin/candidates", label: "View all" }}
    >
      {latest.length === 0 ? (
        <EmptyPanel icon={Users} text="No one has applied yet." />
      ) : (
        <ul className="-mx-2 flex flex-col">
          {latest.map((c) => {
            const badge = CANDIDATE_BADGE[c.status] ?? { tone: "neutral" as const, label: c.status };
            const initials = `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
            return (
              <li key={c.id}>
                <Link
                  href={`/admin/candidates/${c.id}`}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-gray-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/25 to-primary/5 font-heading text-sm font-semibold text-primary-dark"
                  >
                    {initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="block truncate text-xs text-gray-2">{c.job.title}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                    <time dateTime={c.createdAt.toISOString()} className="text-[11px] text-gray-2">
                      {timeAgo(c.createdAt, now)}
                    </time>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

async function JobsOverview() {
  await connection();
  const [statusCounts, { topJobs }] = await Promise.all([getJobStatusCounts(), getCandidateInsights()]);
  const most = Math.max(1, ...topJobs.map((j) => j._count.candidates));
  const jobsHref = "/admin/jobs?sort=status&dir=desc";

  return (
    <Panel
      id="jobs"
      title="Jobs"
      description="Status of your listings and the most popular roles"
      action={{ href: "/admin/jobs", label: "Manage" }}
    >
      <div className="grid grid-cols-3 gap-2">
        {(["published", "draft", "closed"] as const).map((status) => {
          const badge = JOB_BADGE[status];
          return (
            <Link
              key={status}
              href={jobsHref}
              className="rounded-2xl bg-gray-3 px-3 py-3 transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <p className="font-heading text-2xl font-semibold text-ink tabular-nums">{statusCounts[status]}</p>
              <p className="text-xs text-gray-2">{badge.label}</p>
            </Link>
          );
        })}
      </div>

      <h3 className="mt-6 mb-3 flex items-center gap-1.5 text-sm text-ink">
        <Trophy className="size-4 text-primary" aria-hidden="true" />
        Most applied-to
      </h3>
      {topJobs.length === 0 ? (
        <EmptyPanel icon={Briefcase} text="No applications to rank yet." />
      ) : (
        <ol className="flex flex-col gap-3">
          {topJobs.map((job, i) => {
            const badge = JOB_BADGE[job.status] ?? { tone: "neutral" as const, label: job.status };
            return (
              <li key={job.id}>
                <Link
                  href={`/admin/candidates?job=${job.id}`}
                  className="group block rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <span className="flex items-center gap-3 text-sm">
                    <span className="w-4 text-xs font-semibold text-gray-2 tabular-nums">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink group-hover:underline">
                      {job.title}
                    </span>
                    {job.status !== "published" && (
                      <StatusBadge tone={badge.tone} dot={false}>
                        {badge.label}
                      </StatusBadge>
                    )}
                    <span className="font-semibold text-ink tabular-nums">{job._count.candidates}</span>
                  </span>
                  <span aria-hidden="true" className="mt-1.5 ml-7 block h-1.5 overflow-hidden rounded-full bg-gray-3">
                    <span
                      className="block h-full rounded-full bg-primary/70 transition-colors group-hover:bg-primary"
                      style={{ width: `${(job._count.candidates / most) * 100}%` }}
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

async function RecentChanges() {
  await connection();
  const items = await listRecentChanges();

  return (
    <Panel id="recent" title="Recent changes" description="Categories and cities edited most recently">
      {items.length === 0 ? (
        <EmptyPanel icon={Tags} text="Nothing has been edited yet." />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = item.kind === "category" ? Tags : MapPin;
            return (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl border border-line px-3 py-3 transition-[border-color,background-color] hover:border-primary/40 hover:bg-gray-3/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gray-3 text-gray-1">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{item.name}</span>
                    <span className="block text-xs text-gray-2">
                      {item.kind === "category" ? "Category" : "City"} ·{" "}
                      <time dateTime={item.updatedAt.toISOString()}>{formatDate(item.updatedAt)}</time>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function EmptyPanel({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 px-6 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-gray-3 text-gray-2">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm text-gray-2">{text}</p>
    </div>
  );
}
