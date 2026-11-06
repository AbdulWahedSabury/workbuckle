import type { LucideIcon } from "lucide-react";
import { Mail, Phone, User } from "lucide-react";

import { CV_EXTENSIONS, CV_MAX_BYTES } from "@/schemas/AdminSchemas";
import type { ApplicationTextFieldName } from "./types";

export interface TextFieldConfig {
  name: ApplicationTextFieldName;
  /** Key under `apply.fields` in lang/*.json holding the label and placeholder. */
  messageKey: "first_name" | "last_name" | "email" | "phone";
  type: "text" | "email" | "tel" | "url";
  icon: LucideIcon;
  required?: boolean;
  autoComplete?: string;
}
/** Drives the two-column name/contact rows so new fields only need an entry here. */
export const NAME_FIELDS: TextFieldConfig[][] = [
  [
    {
      name: "firstName",
      messageKey: "first_name",
      type: "text",
      icon: User,
      required: true,
      autoComplete: "given-name",
    },
    {
      name: "lastName",
      messageKey: "last_name",
      type: "text",
      icon: User,
      required: true,
      autoComplete: "family-name",
    },
  ],
  [
    {
      name: "email",
      messageKey: "email",
      type: "email",
      icon: Mail,
      required: true,
      autoComplete: "email",
    },
    {
      name: "phone",
      messageKey: "phone",
      type: "tel",
      icon: Phone,
      required: true,
      autoComplete: "tel",
    },
  ],
];


// Same rules the server applies (cvFileSchema).
export const RESUME_EXTENSIONS: readonly string[] = CV_EXTENSIONS;
export const RESUME_MAX_BYTES = CV_MAX_BYTES;
export const RESUME_ACCEPT = CV_EXTENSIONS.map((ext) => `.${ext}`).join(",");
/** For the `{size}` placeholder in the apply.fields.resume.hint and apply.errors.resume_size messages. */
export const RESUME_MAX_MB = CV_MAX_BYTES / (1024 * 1024);

export const EMPTY_APPLICATION_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  linkedin: "",
  coverLetter: "",
  resume: null,
} as const;
