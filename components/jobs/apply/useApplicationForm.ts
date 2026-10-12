import { useCallback, useMemo, useState } from "react";

import { submitApplication } from "@/lib/jobs/actions";
import { EMPTY_APPLICATION_FORM, RESUME_EXTENSIONS, RESUME_MAX_BYTES } from "./applyConfig";
import type { ApplicationFormData } from "./types";

const resumeExtension = (file: File) => file.name.split(".").pop()?.toLowerCase() ?? "";

/** Fields named as the server action expects them (lib/jobs/actions.ts). */
const buildApplicationPayload = (formData: ApplicationFormData) => {
  const payload = new FormData();
  payload.append("firstName", formData.firstName);
  payload.append("lastName", formData.lastName);
  payload.append("email", formData.email);
  payload.append("phone", formData.phone);
  payload.append("linkedin", formData.linkedin);
  payload.append("coverLetter", formData.coverLetter);
  if (formData.resume) payload.append("cv", formData.resume, formData.resume.name);
  return payload;
};

/** Owns form state, resume validation, and submission of a job application. */
export function useApplicationForm(jobId: string) {
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
      const problem =
        file && !RESUME_EXTENSIONS.includes(resumeExtension(file))
          ? "Please upload your resume as a PDF, DOC or DOCX file."
          : file && file.size > RESUME_MAX_BYTES
            ? `Your resume must be ${RESUME_MAX_BYTES / (1024 * 1024)} MB or smaller.`
            : null;
      if (problem) {
        setErrorMessage(problem);
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

      setErrorMessage(null);
      setIsSubmitting(true);

      try {
        const result = await submitApplication(jobId, buildApplicationPayload(formData));
        if (result.ok) setSubmitted(true);
        else setErrorMessage(result.message);
      } catch {
        // The action itself returns expected failures; a throw means the request didn't get through.
        setErrorMessage("Could not reach the server. Please check your connection and try again.");
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