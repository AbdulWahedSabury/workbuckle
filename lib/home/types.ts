import type { LucideIcon } from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
}

export interface TrustStat {
  value: string;
  label: string;
  icon: LucideIcon;
}

export interface Category {
  title: string;
  icon: LucideIcon;
  openings: number;
}

export type Schedule = "Full-Time" | "Part-Time" | "Internship";

export interface Job {
  id: number;
  title: string;
  company: string;
  logo: string;
  location: string;
  remote: boolean;
  salary: string;
  schedule: Schedule;
  experience: string;
  posted: string;
}

export type JobFilter = "All" | Schedule | "Remote";

export interface Company {
  name: string;
  logo: string;
  location: string;
  starts: string;
  openings: number;
}

export type PlanId = "basic" | "standard" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  popular?: boolean;
}

export interface Testimonial {
  name: string;
  role: string;
  image: string;
  quote: string;
}

export interface ProcessStep {
  title: string;
  description: string;
  img: string;
  accents: [string, string];
}
