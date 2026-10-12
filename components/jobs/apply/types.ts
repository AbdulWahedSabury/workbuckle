export interface ApplicationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedin: string;
  coverLetter: string;
  resume: File | null;
}

export type ApplicationTextFieldName = Exclude<
  keyof ApplicationFormData,
  "resume"
>;

