"use client";

import { AlertCircle, Loader2 } from "lucide-react";

import FormTextField from "./FormTextField";
import FormTextAreaField from "./FormTextAreaField";
import ResumeDropzone from "./ResumeDropzone";
import ApplicationSuccessCard from "./ApplicationSuccessCard";
import { useApplicationForm } from "./useApplicationForm";
import { NAME_FIELDS, RESUME_ACCEPT, RESUME_HINT } from "./applyConfig";
import { useTranslations } from "next-intl";

export interface ApplicationFormProps {
  jobId?: number;
}

export default function ApplicationForm({ jobId }: ApplicationFormProps) {
  const f = useTranslations('form');

  const {
    formData,
    updateField,  
    setResume,
    resetForm,
    handleSubmit,
    isFormValid,
    submitted,
    isSubmitting,
    errorMessage,
  } = useApplicationForm(jobId);

  if (submitted) {
    return (
      <ApplicationSuccessCard firstName={formData.firstName} onSubmitAnother={resetForm} />
    );
  }

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-sm sm:p-8 lg:p-10">
      <h2 className="mb-6 border-b border-line pb-4 text-lg font-bold text-ink sm:text-xl">
        Personal Details &amp; Resume
      </h2>

      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="size-5 flex-none text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {NAME_FIELDS.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {row.map((field) => (
              <FormTextField
                key={field.name}
                name={field.name}
                label={field.label}
                type={field.type}
                placeholder={field.placeholder}
                icon={field.icon}
                required={field.required}
                autoComplete={field.autoComplete}
                value={formData[field.name]}
                onChange={(value) => updateField(field.name, value)}
              />
            ))}
          </div>
        ))}

        <ResumeDropzone
          label="Resume / CV"
          resume={formData.resume}
          accept={RESUME_ACCEPT}
          hint={RESUME_HINT}
          required
          onFileSelect={setResume}
          onClear={() => setResume(null)}
        />

        <FormTextAreaField
          name="coverLetter"
          label="Cover Letter / Message"
          placeholder="Introduce yourself and highlight relevant experience..."
          value={formData.coverLetter}
          onChange={(value) => updateField("coverLetter", value)}
        />

        <div className="pt-2">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-4 text-center text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>{f('processing')}</span>
              </>
            ) : (
              <span>{f("btn")}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
