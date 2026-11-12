"use client";

import { useActionState } from "react";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { ASSIGN_STATUSES } from "@/schemas/AdminSchemas";
import { FormMessage, SelectField } from "./fields";
import { SubmitButton } from "./buttons";
import { useActionErrorToast } from "./useActionErrorToast";
import { APPLICATION_STATUS_BADGE } from "./status-labels";

const STATUS_OPTIONS = ASSIGN_STATUSES.map((value) => ({ value, label: APPLICATION_STATUS_BADGE[value].label }));

/** Puts a pool candidate forward for a job with the CV on their profile. */
export default function AssignToJobForm({
  action,
  jobs,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  jobs: readonly { value: string; label: string }[];
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  useActionErrorToast(state);
  const errors = state.errors ?? {};

  if (!jobs.length) {
    return <p className="text-sm text-gray-2">No open job with a free position that they haven&rsquo;t applied for.</p>;
  }
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormMessage message={state.message} />
      <SelectField
        name="jobId"
        label="Job"
        required
        placeholder="Choose a job"
        options={jobs}
        defaultValue={state.values?.jobId}
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
