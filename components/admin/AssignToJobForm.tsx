"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import type { AssignableJobOption } from "@/lib/matching/queries";
import { cn } from "@/lib/utils";
import { ASSIGN_STATUSES } from "@/schemas/AdminSchemas";
import { FormMessage, SelectField } from "./fields";
import { SubmitButton } from "./buttons";
import { useActionErrorToast } from "./useActionErrorToast";
import { APPLICATION_STATUS_BADGE } from "./status-labels";
import MatchBadge from "./jobs/MatchBadge";

const STATUS_OPTIONS = ASSIGN_STATUSES.map((value) => ({
  value,
  label: APPLICATION_STATUS_BADGE[value].label,
}));

/** Puts a pool candidate forward for a job with the CV on their profile. */
export default function AssignToJobForm({
  action,
  jobs,
  jobsHint,
  emptyMessage = "No open job with a free position that they haven\u2019t applied for.",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  jobs: readonly AssignableJobOption[];
  /** Under the job list, e.g. how it was chosen. */
  jobsHint?: string;
  /** Shown instead of the form when `jobs` is empty. */
  emptyMessage?: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  useActionErrorToast(state);
  const errors = state.errors ?? {};

  if (!jobs.length) {
    return <p className="text-sm text-gray-2">{emptyMessage}</p>;
  }
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormMessage message={state.message} />
      <JobPicker
        jobs={jobs}
        defaultValue={state.values?.jobId}
        hint={jobsHint}
        error={errors.jobId}
      />
      <SelectField
        name="status"
        label="Starting status"
        options={STATUS_OPTIONS}
        defaultValue={state.values?.status ?? "pending"}
        hint="Submit them to the employer from the application, once pre-screening notes are in."
        error={errors.status}
      />
      <div>
        <SubmitButton>Assign to job</SubmitButton>
      </div>
    </form>
  );
}

/** Radio cards instead of a select, so each job can show its match ring. */
function JobPicker({
  jobs,
  defaultValue,
  hint,
  error,
}: {
  jobs: readonly AssignableJobOption[];
  defaultValue?: string;
  hint?: string;
  error?: string[];
}) {
  const invalid = Boolean(error?.length);
  const [selected, setSelected] = useState(defaultValue ?? "");
  return (
    <fieldset
      className="flex min-w-0 flex-col gap-1.5"
      aria-describedby={invalid ? "jobId-error" : undefined}
    >
      <legend className="mb-1.5 text-sm font-semibold text-ink">
        Job{" "}
        <span className="text-red-600" aria-hidden="true">
          *
        </span>
      </legend>
      <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
        {jobs.map((job) => {
          const isSelected = job.value === selected;
          return (
            <label
              key={job.value}
              // Selected colours are inline so the state shows even before the stylesheet catches up.
              style={
                isSelected
                  ? {
                      borderColor: "var(--color-primary)",
                      backgroundColor: "var(--color-white)",
                    }
                  : undefined
              }
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-gray-3 px-3 py-2.5 transition-[border-color,background-color] hover:border-ink/10",
                "has-focus-visible:ring-4 has-focus-visible:ring-primary/15",
                invalid && !isSelected && "border-red-500",
              )}
            >
              <input
                type="radio"
                name="jobId"
                value={job.value}
                required
                checked={isSelected}
                onChange={() => setSelected(job.value)}
                className="sr-only"
              />
              {job.match !== null && <MatchBadge match={job.match} size={64} />}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">
                  {job.label}
                </span>
                <span className="block truncate text-xs text-gray-2">
                  {job.detail}
                </span>
              </span>
              {isSelected && (
                <span
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-on-primary)",
                  }}
                  className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold"
                >
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                  Selected
                </span>
              )}
            </label>
          );
        })}
      </div>
      {invalid ? (
        <p id="jobId-error" role="alert" className="text-xs text-red-600">
          {error?.[0]}
        </p>
      ) : hint ? (
        <p className="text-xs text-gray-2">{hint}</p>
      ) : null}
    </fieldset>
  );
}
