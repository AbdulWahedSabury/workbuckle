"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import type { SelectOption } from "@/lib/admin/queries";
import { JOB_STATUSES, type JobStatus } from "@/schemas/AdminSchemas";
import { FormMessage, SelectField, TextField } from "./fields";
import { SubmitButton } from "./buttons";
import RichTextEditor from "./RichTextEditor";
import { fieldsetClass, legendClass, secondaryLinkClass } from "./styles";

export type JobFormValues = {
  title: string;
  salary: string;
  experience: string;
  cityId: string;
  jobTypeId: string;
  jobCategoryId: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  status: string;
};

export type JobFormOptions = {
  cities: SelectOption[];
  jobTypes: SelectOption[];
  categories: SelectOption[];
};

const STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft — not visible",
  published: "Published",
  closed: "Closed — no longer hiring",
};

const statusOptions = JOB_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));

const RICH_TEXT_FIELDS = [
  {
    name: "description",
    label: "Description",
    placeholder: "What the role is and who it suits…",
  },
  {
    name: "responsibilities",
    label: "Responsibilities",
    placeholder: "Day-to-day duties, ideally as a bulleted list…",
  },
  {
    name: "requirements",
    label: "Requirements",
    placeholder: "Skills, languages, certificates…",
  },
  {
    name: "benefits",
    label: "Benefits",
    placeholder: "Accommodation, meals, transport, bonuses…",
  },
] as const;

/** Hint for an empty select, pointing at the page where its options are managed. */
function emptyHint(options: SelectOption[], what: string, href: string) {
  return options.length ? undefined : (
    <>
      No {what} yet —{" "}
      <Link href={href} className="font-semibold text-primary-dark underline underline-offset-2">
        add one first
      </Link>
      .
    </>
  );
}

export default function JobForm({
  action,
  initialJob,
  options,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initialJob?: JobFormValues;
  options: JobFormOptions;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  // After a failed submit, show what was typed rather than the saved values.
  const v = state.values;
  const errors = state.errors ?? {};
  const value = (field: keyof JobFormValues) => (v ? v[field] : initialJob?.[field]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FormMessage message={state.message} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Main column: what candidates read. */}
        <div className="flex min-w-0 flex-col gap-6">
          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>Basics</legend>
            <TextField
              name="title"
              label="Job title"
              placeholder="Front desk receptionist"
              required
              defaultValue={value("title")}
              error={errors.title}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                name="salary"
                label="Salary"
                placeholder="€1,200 – €1,500 / month"
                required
                defaultValue={value("salary")}
                error={errors.salary}
              />
              <TextField
                name="experience"
                label="Experience"
                placeholder="1+ year in hospitality"
                required
                defaultValue={value("experience")}
                error={errors.experience}
              />
            </div>
          </fieldset>

          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>Job details</legend>
            {RICH_TEXT_FIELDS.map((field) => (
              <RichTextEditor
                key={field.name}
                name={field.name}
                label={field.label}
                placeholder={field.placeholder}
                required
                defaultValue={value(field.name)}
                error={errors[field.name]}
              />
            ))}
          </fieldset>
        </div>

        {/* Side column: settings, kept in view while writing on large screens. */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-6">
          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>Publishing</legend>
            <SelectField
              name="status"
              label="Status"
              required
              options={statusOptions}
              defaultValue={value("status") ?? "draft"}
              error={errors.status}
            />
          </fieldset>

          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>Classification</legend>
            <SelectField
              name="jobTypeId"
              label="Job type"
              placeholder="Choose a job type"
              required
              options={options.jobTypes}
              defaultValue={value("jobTypeId")}
              error={errors.jobTypeId}
              hint={emptyHint(options.jobTypes, "job types", "/admin/job-types/new")}
            />
            <SelectField
              name="jobCategoryId"
              label="Category"
              placeholder="Choose a category"
              required
              options={options.categories}
              defaultValue={value("jobCategoryId")}
              error={errors.jobCategoryId}
              hint={emptyHint(options.categories, "active categories", "/admin/categories")}
            />
            <SelectField
              name="cityId"
              label="City"
              placeholder="Choose a city"
              required
              options={options.cities}
              defaultValue={value("cityId")}
              error={errors.cityId}
              hint={emptyHint(options.cities, "cities", "/admin/cities/new")}
            />
          </fieldset>

          <div className="flex items-center gap-3">
            <SubmitButton>{submitLabel}</SubmitButton>
            <Link href="/admin/jobs" className={secondaryLinkClass}>
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
