import type { LucideIcon } from "lucide-react";
import { Mail, Phone, User } from "lucide-react";

import { CV_EXTENSIONS, CV_MAX_BYTES } from "@/schemas/AdminSchemas";
import type { ApplicationTextFieldName } from "./types";

export interface TextFieldConfig {
  name: ApplicationTextFieldName;
  label: string;
  type: "text" | "email" | "tel" | "url";
  placeholder: string;
  icon: LucideIcon;
  required?: boolean;
  autoComplete?: string;
}
/** Drives the two-column name/contact rows so new fields only need an entry here. */
export const NAME_FIELDS: TextFieldConfig[][] = [
  [
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      placeholder: "John",
      icon: User,
      required: true,
      autoComplete: "given-name",
    },
    {
      name: "lastName",
      label: "Last Name",
      type: "text",
      placeholder: "Doe",
      icon: User,
      required: true,
      autoComplete: "family-name",
    },
  ],
  [
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "john.doe@example.com",
      icon: Mail,
      required: true,
      autoComplete: "email",
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "tel",
      placeholder: "+357 99 123456",
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
export const RESUME_HINT = `PDF, DOC or DOCX (Max ${CV_MAX_BYTES / (1024 * 1024)}MB)`;

export const EMPTY_APPLICATION_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  linkedin: "",
  coverLetter: "",
  resume: null,
} as const;
