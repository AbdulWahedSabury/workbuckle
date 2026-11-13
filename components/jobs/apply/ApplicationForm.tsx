"use client";

import { AlertCircle, Link2, Loader2 } from "lucide-react";

import CaptchaWidget from "@/components/form/CaptchaWidget";
import FormTextField from "./FormTextField";
import FormTextAreaField from "./FormTextAreaField";
import ResumeDropzone from "./ResumeDropzone";
import ApplicationSuccessCard from "./ApplicationSuccessCard";
import { useApplicationForm } from "./useApplicationForm";
import { NAME_FIELDS, RESUME_ACCEPT, RESUME_MAX_MB } from "./applyConfig";
import { useTranslations } from "next-intl";

export interface ApplicationFormProps {
  jobId: string;
}

export default function ApplicationForm({ jobId }: ApplicationFormProps) {
  const f = useTranslations('form');
  const t = useTranslations('apply');

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
    captchaRef,
    setCaptchaToken,
  } = useApplicationForm(jobId);

  if (submitted) {
    return (
      <ApplicationSuccessCard firstName={formData.firstName} onSubmitAnother={resetForm} />
    );
  }

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-sm sm:p-8 lg:p-10">
      <h2 className="mb-6 border-b border-line pb-4 text-lg font-bold text-ink sm:text-xl">
        {t("heading")}
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
                label={t(`fields.${field.messageKey}.label`)}
                type={field.type}
                placeholder={t(`fields.${field.messageKey}.placeholder`)}
                icon={field.icon}
                required={field.required}
                autoComplete={field.autoComplete}
                value={formData[field.name]}
                onChange={(value) => updateField(field.name, value)}
              />
            ))}
          </div>
        ))}

        <FormTextField
          name="linkedin"
          label={t("fields.linkedin.label")}
          type="url"
          placeholder={t("fields.linkedin.placeholder")}
          icon={Link2}
          value={formData.linkedin}
          onChange={(value) => updateField("linkedin", value)}
        />

        <ResumeDropzone
          label={t("fields.resume.label")}
          resume={formData.resume}
          accept={RESUME_ACCEPT}
          hint={t("fields.resume.hint", { size: RESUME_MAX_MB })}
          required
          onFileSelect={setResume}
          onClear={() => setResume(null)}
        />

        <FormTextAreaField
          name="coverLetter"
          label={t("fields.cover_letter.label")}
          placeholder={t("fields.cover_letter.placeholder")}
          value={formData.coverLetter}
          onChange={(value) => updateField("coverLetter", value)}
        />

        <CaptchaWidget ref={captchaRef} onToken={setCaptchaToken} />

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
