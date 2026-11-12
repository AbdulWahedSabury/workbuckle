// Labels and badge tones for the hiring workflow's statuses, shared by the
// candidates list, profile page, jobs table and dashboard. Client-safe.
import type { StatusTone } from "./StatusBadge";
import type { ApplicationStatus, CandidateStatus, InterviewStatus } from "@/schemas/AdminSchemas";

type Badge = { tone: StatusTone; label: string };

export const APPLICATION_STATUS_BADGE: Record<ApplicationStatus, Badge> = {
  pending: { tone: "neutral", label: "Pending" },
  under_review: { tone: "brand", label: "Under review" },
  shortlisted: { tone: "success", label: "Shortlisted" },
  submitted: { tone: "neutral", label: "Submitted" },
  interview: { tone: "brand", label: "Interview" },
  rejected: { tone: "danger", label: "Rejected" },
  hired: { tone: "success", label: "Hired" },
  cancelled: { tone: "neutral", label: "Cancelled" },
};

export const CANDIDATE_STATUS_BADGE: Record<CandidateStatus, Badge> = {
  open: { tone: "success", label: "Open" },
  hired: { tone: "brand", label: "Hired" },
  inactive: { tone: "neutral", label: "Inactive" },
};

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  not_scheduled: "Not scheduled",
  scheduled: "Scheduled",
  completed: "Completed",
  passed: "Passed",
  failed: "Failed",
  cancelled: "Cancelled",
};

/** Badge for a status string from the database; unknown values show as-is. */
export function badgeFor<K extends string>(badges: Record<K, Badge>, status: string): Badge {
  return (badges as Record<string, Badge | undefined>)[status] ?? { tone: "neutral", label: status };
}
