"use client";

import { useActionState } from "react";
import { initialActionState } from "@/lib/admin/action-state";
import { updateSiteSettings } from "@/lib/admin/actions/settings";
import type { SiteSetting } from "@/lib/generated/prisma/browser";
import { CheckboxField, FormMessage, TextAreaField, TextField } from "./fields";
import { SubmitButton } from "./buttons";
import ImageUploadField from "./ImageUploadField";
import { fieldsetClass, legendClass } from "./styles";

type Settings = Omit<SiteSetting, "id" | "createdAt" | "updatedAt">;

export default function SettingsForm({
  settings,
  readOnly = false,
}: {
  settings: Settings;
  /** Read-only roles see the values with every field disabled. */
  readOnly?: boolean;
}) {
  const [state, formAction] = useActionState(
    updateSiteSettings,
    initialActionState
  );
  // After a failed submit, show what was typed rather than the saved values.
  const v = state.values;
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <FormMessage message={readOnly ? "You have read-only access to settings." : state.message} />

      {/* A disabled outer fieldset disables every control inside it. */}
      <fieldset disabled={readOnly} className="flex flex-col gap-6">
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>
          General
        </legend>
        <TextField
          name="siteName"
          label="Website name"
          required
          defaultValue={v ? v.siteName : settings.siteName}
          error={errors.siteName}
        />
        <TextField
          name="contactEmail"
          label="Contact email"
          type="email"
          defaultValue={v ? v.contactEmail : settings.contactEmail}
          error={errors.contactEmail}
        />
        <TextField
          name="contactPhone"
          label="Contact phone"
          type="tel"
          defaultValue={v ? v.contactPhone : settings.contactPhone}
          error={errors.contactPhone}
        />
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>
          Branding
        </legend>
        <ImageUploadField
          name="logoFile"
          label="Logo"
          existingName="logoUrl"
          existingUrl={v ? v.logoUrl : settings.logoUrl}
          error={errors.logoUrl}
        />
        <TextField
          name="faviconUrl"
          label="Favicon URL"
          placeholder="https://… or /favicon.ico"
          defaultValue={v ? v.faviconUrl : settings.faviconUrl}
          error={errors.faviconUrl}
        />
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>
          SEO
        </legend>
        <TextField
          name="metaTitle"
          label="Meta title"
          hint="Browser tab and search result title. Falls back to the website name."
          defaultValue={v ? v.metaTitle : settings.metaTitle}
          error={errors.metaTitle}
        />
        <TextAreaField
          name="metaDescription"
          label="Meta description"
          defaultValue={v ? v.metaDescription : settings.metaDescription}
          error={errors.metaDescription}
        />
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>
          Social &amp; about
        </legend>
        <TextField
          name="facebookUrl"
          label="Facebook"
          type="url"
          placeholder="https://facebook.com/…"
          defaultValue={v ? v.facebookUrl : settings.facebookUrl}
          error={errors.facebookUrl}
        />
        <TextField
          name="linkedinUrl"
          label="LinkedIn"
          type="url"
          placeholder="https://linkedin.com/company/…"
          defaultValue={v ? v.linkedinUrl : settings.linkedinUrl}
          error={errors.linkedinUrl}
        />
        <TextField
          name="instagramUrl"
          label="Instagram"
          type="url"
          placeholder="https://instagram.com/…"
          defaultValue={v ? v.instagramUrl : settings.instagramUrl}
          error={errors.instagramUrl}
        />
        <TextAreaField
          name="about"
          label="About"
          defaultValue={v ? v.about : settings.about}
          error={errors.about}
        />
      </fieldset>

      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>
          Maintenance
        </legend>
        <CheckboxField
          name="maintenanceMode"
          label="Maintenance mode"
          hint="Stored here; the public site doesn't read it yet."
          defaultChecked={
            v ? v.maintenanceMode === "on" : settings.maintenanceMode
          }
        />
        <TextAreaField
          name="maintenanceMessage"
          label="Maintenance message"
          defaultValue={v ? v.maintenanceMessage : settings.maintenanceMessage}
          error={errors.maintenanceMessage}
        />
      </fieldset>
      </fieldset>

      {!readOnly && (
        <div>
          <SubmitButton>Save settings</SubmitButton>
        </div>
      )}
    </form>
  );
}
