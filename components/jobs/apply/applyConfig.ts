import type { LucideIcon } from "lucide-react";
import { Mail, Phone, User, Link as LinkIcon } from "lucide-react";

import type { ApplicationTextFieldName } from "./types";
import { getTranslations } from "next-intl/server";

export const ApplyUrl = (jobId: string) =>
  `https://api.manatal.com/open/v3/career-page/mavromatis-employment-bureau/jobs/${jobId}/apply/`;

export interface TextFieldConfig {
  name: ApplicationTextFieldName;
  label: string;
  type: "text" | "email" | "tel" | "url";
  placeholder: string;
  icon: LucideIcon;
  required?: boolean;
  autoComplete?: string;
}
const f = getTranslations('form')
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


export const RESUME_ACCEPT = ".pdf,.docx";
export const RESUME_HINT = "PDF or DOCX (Max 10MB)";

export const EMPTY_APPLICATION_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  linkedin: "",
  coverLetter: "",
  resume: null,
} as const;
