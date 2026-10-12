import type { Metadata } from "next";
import JobsListView from "@/components/jobs/JobsListView";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Search and filter open hospitality roles across Cyprus.",
};

export default function JobsListPage() {
  return <JobsListView />;
}
