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

export type contract_details = "full_time" | "Part-Time" | "Internship";

export interface Job {
  id: number;
  title: string;
  company: string;
  logo: string;
  location: string;
  remote: boolean;
  salary: string;
  contract_details: string;
  experience: string;
  posted: string;
}

export type JobFilter = "All" | contract_details | "Remote";

export interface Company {
  name: string;
  logo: string;
  location: string;
  starts: string;
  openings: number;
  url : string;
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
