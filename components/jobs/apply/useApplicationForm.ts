import { useCallback, useMemo, useState } from "react";

import { EMPTY_APPLICATION_FORM, ApplyUrl } from "./applyConfig";
import type { ApplicationFormData } from "./types";

const ACCEPTED_RESUME_EXTENSIONS = [".pdf", ".docx"];

const isAcceptedResume = (file: File) =>
  file.type === "application/pdf" ||
  ACCEPTED_RESUME_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

/**
 * Builds the multipart body for Manatal's
 * POST /career-page/{client_slug}/jobs/{id}/apply/
 * Required: full_name, email, resume. Optional: phone_number, linkedin, message.
 */
const buildApplicationPayload = (formData: ApplicationFormData) => {
  const payload = new FormData();
  payload.append("full_name", `${formData.firstName} ${formData.lastName}`.trim());
  payload.append("email", formData.email.trim());

  if (formData.phone) payload.append("phone_number", formData.phone.trim());
  if (formData.linkedin) payload.append("linkedin", formData.linkedin.trim());
  if (formData.coverLetter) payload.append("message", formData.coverLetter);
  if (formData.resume) payload.append("resume", formData.resume, formData.resume.name);

  return payload;
};

/** Manatal returns Django REST errors: {"detail": "..."} or {"field": ["msg", ...]}. */
const extractErrorMessage = (data: unknown, status: number): string => {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === "string") return d.detail;
    if (typeof d.message === "string") return d.message;

    const fieldErrors = Object.entries(d)
      .map(([field, msgs]) => {
        const text = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
        return `${field.replace(/_/g, " ")}: ${text}`;
      })
      .join("; ");
    if (fieldErrors) return fieldErrors;
  }
  return `Submission failed (${status}). Please check your details and try again.`;
};

/** Owns form state, resume validation, and submission for the Manatal job application form. */
export function useApplicationForm(jobId: number | string | undefined) {
  const [formData, setFormData] = useState<ApplicationFormData>(EMPTY_APPLICATION_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Pass as `key` to the <input type="file"> so it clears on reset / rejected file.
  const [resumeInputKey, setResumeInputKey] = useState(0);

  const updateField = useCallback(
    <K extends keyof ApplicationFormData>(name: K, value: ApplicationFormData[K]) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const setResume = useCallback(
    (file: File | null) => {
      if (file && !isAcceptedResume(file)) {
        setErrorMessage("Please upload your resume as a PDF or DOCX file.");
        updateField("resume", null);
        setResumeInputKey((k) => k + 1);
        return;
      }
      updateField("resume", file);
      if (file) setErrorMessage(null);
    },
    [updateField]
  );

  const resetForm = useCallback(() => {
    setFormData(EMPTY_APPLICATION_FORM);
    setSubmitted(false);
    setErrorMessage(null);
    setResumeInputKey((k) => k + 1);
  }, []);

  const isFormValid = useMemo(
    () =>
      Boolean(
        formData.firstName.trim() &&
          formData.lastName.trim() &&
          formData.email.trim() &&
          formData.phone.trim() &&
          formData.resume
      ),
    [formData]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (isSubmitting || !isFormValid) return;

      if (jobId === undefined || jobId === null || jobId === "") {
        setErrorMessage("This job is not available right now. Please refresh the page and try again.");
        return;
      }

      setErrorMessage(null);
      setIsSubmitting(true);

      try {
        // Do NOT set Content-Type manually — the browser adds the multipart boundary.
        const response = await fetch(ApplyUrl(String(jobId)), {
          method: "POST",
          body: buildApplicationPayload(formData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(extractErrorMessage(errorData, response.status));
        }

        setSubmitted(true);
      } catch (err) {
        // A TypeError here with no status usually means CORS / network failure.
        const message =
          err instanceof TypeError
            ? "Could not reach the application server. Please try again later."
            : err instanceof Error
              ? err.message
              : "An unexpected error occurred. Please try again.";
        setErrorMessage(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, jobId, isFormValid, isSubmitting]
  );

  return {
    formData,
    updateField,
    setResume,
    resetForm,
    handleSubmit,
    isFormValid,
    submitted,
    isSubmitting,
    errorMessage,
    resumeInputKey,
  };
}