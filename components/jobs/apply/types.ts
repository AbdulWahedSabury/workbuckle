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

/** Static metadata about the job being applied to, used by the hero and submission payload. */
export interface JobApplyInfo {
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  department: string;
}
