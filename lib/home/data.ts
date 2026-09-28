import {
  BadgeCheck,
  Bot,
  Building2,
  Clapperboard,
  CodeXml,
  Megaphone,
  Palette,
  PieChart,
  UserSearch,
  Users,
} from "lucide-react";
import type {
  Category,
  Job,
  JobFilter,
  NavLink,
  Plan,
  Testimonial,
  TrustStat,
} from "@/lib/home/types";

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Jobs", href: "#jobs" },
  { label: "Companies", href: "#companies" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "/about" },
];

export const TRUST_STATS: TrustStat[] = [
  { value: "50K+", label: "Trusted users", icon: Users },
  { value: "100+", label: "Wide range of industries", icon: Building2 },
  { value: "25K+", label: "Found their dream jobs", icon: BadgeCheck },
];

export const CATEGORIES: Category[] = [
  { title: "UI/UX Design", icon: Palette, openings: 186 },
  { title: "Human Research", icon: UserSearch, openings: 74 },
  { title: "Digital Marketing", icon: Megaphone, openings: 152 },
  { title: "Video & Animation", icon: Clapperboard, openings: 63 },
  { title: "Business Analysis", icon: PieChart, openings: 98 },
  { title: "AI Services", icon: Bot, openings: 121 },
  { title: "Programming & Tech", icon: CodeXml, openings: 347 },
];

export const JOB_FILTERS: JobFilter[] = [
  "All",
  "full_time",
  "Part-Time",
  "Internship",
  "Remote",
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Jacqueline Miller",
    role: "Healthcare Administrator",
    image: "/images/testimonials/review-1.jpg",
    quote:
      "I had been applying for months elsewhere. Here the listings were current, the salaries were visible, and I had two interviews in my first week.",
  },
  {
    name: "Louis Ferguson",
    role: "Head of Product",
    image: "/images/testimonials/review-2.jpg",
    quote:
      "We posted one product role and had a shortlist of strong candidates within days. The applicant board kept the whole team on the same page.",
  },
  {
    name: "Priya Raman",
    role: "Data Analyst",
    image: "/images/testimonials/review-3.jpg",
    quote:
      "Filtering by experience level meant I only saw roles I was genuinely qualified for. It made switching industries feel manageable.",
  },
];