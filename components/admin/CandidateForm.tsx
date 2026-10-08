"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
import { CANDIDATE_STATUSES } from "@/schemas/AdminSchemas";
import { FormMessage, SelectField, TextAreaField, TextField } from "./fields";
import { SubmitButton } from "./buttons";
import { fieldsetClass, secondaryLinkClass } from "./styles";

const STATUS_OPTIONS = CANDIDATE_STATUSES.map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

export default function CandidateForm({
  action,
  jobs,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  jobs: readonly { value: string; label: string }[];
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  // After a failed submit, show what was typed. File inputs can't be refilled.
  const v = state.values;
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormMessage message={state.message} />

      <div className={fieldsetClass}>
        <SelectField
          name="jobId"
          label="Job"
          required
          placeholder="Select a job"
          options={jobs}
          defaultValue={v?.jobId}
          error={errors.jobId}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField name="firstName" label="First name" required defaultValue={v?.firstName} error={errors.firstName} />
          <TextField name="lastName" label="Last name" required defaultValue={v?.lastName} error={errors.lastName} />
          <TextField name="email" type="email" label="Email" required defaultValue={v?.email} error={errors.email} />
          <TextField name="phone" type="tel" label="Phone" required placeholder="+357 99 123456" defaultValue={v?.phone} error={errors.phone} />
        </div>
        <TextField
          name="linkedin"
          type="url"
          label="LinkedIn"
          placeholder="https://linkedin.com/in/…"
          defaultValue={v?.linkedin}
          error={errors.linkedin}
        />
      </div>

      <div className={fieldsetClass}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cv" className="text-sm font-semibold text-ink">
            CV <span className="text-red-600" aria-hidden="true">*</span>
          </label>
          <input
            id="cv"
            name="cv"
            type="file"
            required
            accept=".pdf,.doc,.docx"
            aria-invalid={errors.cv?.length ? true : undefined}
            aria-describedby={errors.cv?.length ? "cv-error" : undefined}
            className="w-full cursor-pointer rounded-xl bg-gray-3 p-2 text-sm text-ink file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white aria-invalid:border aria-invalid:border-red-500"
          />
          {errors.cv?.length ? (
            <p id="cv-error" role="alert" className="text-xs text-red-600">
              {errors.cv[0]}
            </p>
          ) : (
            <p className="text-xs text-gray-2">PDF, DOC or DOCX, up to 10 MB.</p>
          )}
        </div>
        <TextAreaField
          name="coverLetter"
          label="Cover letter"
          rows={6}
          defaultValue={v?.coverLetter}
          error={errors.coverLetter}
        />
        <SelectField
          name="status"
          label="Status"
          options={STATUS_OPTIONS}
          defaultValue={v?.status ?? "pending"}
          error={errors.status}
        />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link href="/admin/candidates" className={secondaryLinkClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
