"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveInterview } from "@/lib/admin/actions/applications";
import { INTERVIEW_STATUSES, type InterviewInput, type InterviewStatus } from "@/schemas/AdminSchemas";
import { SelectField, TextAreaField, TextField } from "./fields";
import { SubmitButton } from "./buttons";
import { INTERVIEW_STATUS_LABELS } from "./status-labels";

const STATUS_OPTIONS = INTERVIEW_STATUSES.map((value) => ({ value, label: INTERVIEW_STATUS_LABELS[value] }));

type FieldErrors = Record<string, string[] | undefined>;

/**
 * Employer interview tracking. Saving a scheduled or completed interview moves
 * an earlier-stage application to Interview; a result never hires on its own.
 */
export default function InterviewForm({
  applicationId,
  initial,
}: {
  applicationId: string;
  /** interviewAt as a datetime-local value in Cyprus time ("" when unset). */
  initial: { interviewStatus: InterviewStatus; interviewAt: string; interviewNotes: string; employerFeedback: string };
}) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: InterviewInput = {
      interviewStatus: String(data.get("interviewStatus")) as InterviewStatus,
      interviewAt: String(data.get("interviewAt") ?? ""),
      interviewNotes: String(data.get("interviewNotes") ?? ""),
      employerFeedback: String(data.get("employerFeedback") ?? ""),
    };
    startTransition(async () => {
      const result = await saveInterview(applicationId, input);
      setErrors(result.fieldErrors ?? {});
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Interview details saved.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          name="interviewStatus"
          label="Interview status"
          required
          options={STATUS_OPTIONS}
          defaultValue={initial.interviewStatus}
          error={errors.interviewStatus}
        />
        <TextField
          name="interviewAt"
          label="Date and time (Cyprus)"
          type="datetime-local"
          defaultValue={initial.interviewAt}
          error={errors.interviewAt}
        />
      </div>
      <TextAreaField
        name="employerFeedback"
        label="Employer feedback"
        rows={4}
        defaultValue={initial.employerFeedback}
        error={errors.employerFeedback}
      />
      <TextAreaField
        name="interviewNotes"
        label="Interview notes"
        rows={4}
        defaultValue={initial.interviewNotes}
        error={errors.interviewNotes}
      />
      <div>
        <SubmitButton disabled={pending}>Save interview</SubmitButton>
      </div>
    </form>
  );
}
