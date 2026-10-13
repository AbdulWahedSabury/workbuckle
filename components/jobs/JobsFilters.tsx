"use client";

import { Briefcase, ChevronDown, LayoutGrid, Megaphone, X, type LucideIcon } from "lucide-react";
import type { CategoryOption, CityOption, JobTypeOption } from "@/types/job";
import { useJobsQuery } from "./JobsQueryProvider";
import LocationChips from "./LocationChips";

/**
 * Filter bar for the /jobs feed: location chips (`?location=`), job type
 * (`?type=`) and category (`?category=`) pickers, a removable chip for a
 * campaign (`?campaign=`, set by the home page's campaign cards) and, once
 * anything is filtered, a way back to every role.
 */
export default function JobsFilters({
  cities,
  jobTypes,
  categories,
  campaignTitle,
}: {
  cities: CityOption[];
  jobTypes: JobTypeOption[];
  categories: CategoryOption[];
  /** Title of the `?campaign=` filter; null when it names no campaign. */
  campaignTitle: string | null;
}) {
  const { type, setType, category, setCategory, campaign, setCampaign, hasFilters, clearFilters } =
    useJobsQuery();

  return (
    <div className="flex flex-col gap-2 rounded-sm-card border border-line bg-white p-2 lg:flex-row lg:items-center">
      <LocationChips cities={cities} className="lg:flex-1" />

      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        {campaign && (
          <button
            type="button"
            onClick={() => setCampaign("")}
            aria-label={`Remove campaign filter: ${campaignTitle ?? "unknown campaign"}`}
            title="Show jobs from every campaign"
            className="inline-flex h-12 max-w-full min-w-0 flex-none items-center gap-2 rounded-full bg-ink pr-3 pl-4 text-sm font-semibold text-white transition-colors hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none lg:max-w-60"
          >
            <Megaphone className="size-4 flex-none text-primary" aria-hidden="true" />
            <span className="truncate">{campaignTitle ?? "Unknown campaign"}</span>
            <X className="size-4 flex-none" aria-hidden="true" />
          </button>
        )}
        <FilterSelect
          label="Category"
          allLabel="All categories"
          icon={LayoutGrid}
          value={category}
          options={categories}
          onChange={setCategory}
        />
        <FilterSelect
          label="Job type"
          allLabel="All job types"
          icon={Briefcase}
          value={type}
          options={jobTypes}
          onChange={setType}
        />

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-12 flex-none items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-gray-2 transition-colors hover:bg-gray-3 hover:text-ink focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <X className="size-4" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

/** Pill-shaped native select over `{ name, slug }` options; '' means "all". */
function FilterSelect({
  label,
  allLabel,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  icon: LucideIcon;
  value: string;
  options: { name: string; slug: string }[];
  onChange: (slug: string) => void;
}) {
  // A slug from the URL with no published jobs isn't in the list; keep it
  // selectable so the picker shows what is actually being filtered.
  const choices =
    value && !options.some((option) => option.slug === value)
      ? [...options, { name: value, slug: value }]
      : options;

  return (
    <label className="relative min-w-0 flex-1 lg:flex-none">
      <span className="sr-only">{label}</span>
      <Icon
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-gray-2"
        aria-hidden="true"
      />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full cursor-pointer appearance-none rounded-full bg-gray-3 pr-10 pl-10 text-sm font-semibold text-ink transition-colors outline-none hover:text-primary-dark focus-visible:ring-2 focus-visible:ring-primary lg:w-52"
      >
        <option value="">{allLabel}</option>
        {choices.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink"
        aria-hidden="true"
      />
    </label>
  );
}
