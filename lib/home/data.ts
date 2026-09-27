import {
  BadgeCheck,
  Bot,
  Building2,
  Clapperboard,
  CodeXml,
  FileCheck,
  Home,
  Hotel,
  Megaphone,
  Palette,
  PieChart,
  PlaneLanding,
  ShieldCheck,
  Sun,
  UserSearch,
  Users,
  UtensilsCrossed,
  Waves,
} from "lucide-react";
import type {
  Category,
  Company,
  Job,
  JobFilter,
  NavLink,
  Plan,
  ProcessStep,
  Testimonial,
  TrustStat,
} from "@/lib/home/types";

/* Mock data for the home page. Replace with API calls when a backend exists. */

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

export const JOBS: Job[] = [
  {
    id: 1,
    title: "Senior Full Stack Engineer",
    company: "Talon Tech LLC",
    logo: "/images/companies/company-1.png",
    location: "San Francisco, US",
    remote: true,
    salary: "$120k – $150k",
    schedule: "Full-Time",
    experience: "5+ years",
    posted: "2 days ago",
  },
  {
    id: 2,
    title: "Audio Production Specialist",
    company: "Creative Media Agency",
    logo: "/images/companies/company-2.png",
    location: "London, UK",
    remote: false,
    salary: "$55k – $70k",
    schedule: "Full-Time",
    experience: "3+ years",
    posted: "Today",
  },
  {
    id: 3,
    title: "Business Intelligence Analyst",
    company: "Vertex Consulting Group",
    logo: "/images/companies/company-3.png",
    location: "Toronto, CA",
    remote: true,
    salary: "$80k – $95k",
    schedule: "Full-Time",
    experience: "2+ years",
    posted: "3 days ago",
  },
  {
    id: 4,
    title: "Junior UI Designer",
    company: "Creative Media Agency",
    logo: "/images/companies/company-2.png",
    location: "Berlin, DE",
    remote: false,
    salary: "$2.4k / month",
    schedule: "Internship",
    experience: "No experience",
    posted: "1 day ago",
  },
  {
    id: 5,
    title: "Growth Marketing Associate",
    company: "Vertex Consulting Group",
    logo: "/images/companies/company-3.png",
    location: "Austin, US",
    remote: true,
    salary: "$32 / hour",
    schedule: "Part-Time",
    experience: "1+ year",
    posted: "5 days ago",
  },
  {
    id: 6,
    title: "Machine Learning Intern",
    company: "Talon Tech LLC",
    logo: "/images/companies/company-1.png",
    location: "Remote",
    remote: true,
    salary: "$3k / month",
    schedule: "Internship",
    experience: "Student",
    posted: "4 days ago",
  },
];

export const JOB_FILTERS: JobFilter[] = ["All", "Full-Time", "Part-Time", "Internship", "Remote"];

// export const COMPANIES: Company[] = [
//   {
//     name: "Creative Media Agency",
//     logo: "/images/companies/company-2.png",
//     location: "London, UK",
//     industry: "Media & Production",
//     openings: 12,
//   },
//   {
//     name: "Vertex Consulting Group",
//     logo: "/images/companies/company-3.png",
//     location: "Toronto, CA",
//     industry: "Consulting",
//     openings: 8,
//   },
//   {
//     name: "Talon Tech LLC",
//     logo: "/images/companies/company-1.png",
//     location: "San Francisco, US",
//     industry: "Software",
//     openings: 21,
//   },
// ];

export const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: "$35.00",
    cadence: "per job post",
    blurb: "For teams making an occasional hire.",
    features: ["1 active job listing", "Listed for 30 days", "Standard search visibility", "Email applicant alerts"],
  },
  {
    id: "standard",
    name: "Standard",
    price: "$99.00",
    cadence: "per month",
    blurb: "For growing teams hiring every month.",
    features: [
      "5 active job listings",
      "Highlighted in search results",
      "Featured on the home page for 7 days",
      "Applicant tracking board",
      "Company profile page",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$120.00",
    cadence: "per month",
    blurb: "For organisations hiring at scale.",
    features: [
      "Unlimited job listings",
      "Top placement in every category",
      "Permanent home page feature",
      "Team seats and shared pipeline",
      "Dedicated account manager",
    ],
  },
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

// export const FOOTER_COLUMNS: FooterColumn[] = [
//   {
//     title: "For candidates",
//     links: [
//       { label: "Browse jobs", href: "#jobs" },
//       { label: "Categories", href: "#categories" },
//       { label: "Companies", href: "#companies" },
//       { label: "Career advice", href: "#" },
//     ],
//   },
//   {
//     title: "For employers",
//     links: [
//       { label: "Post a job", href: "#pricing" },
//       { label: "Pricing", href: "#pricing" },
//       { label: "Hiring guide", href: "#" },
//       { label: "Contact sales", href: "#" },
//     ],
//   },
//   {
//     title: "Company",
//     links: [
//       { label: "About us", href: "/about" },
//       { label: "Blog", href: "#" },
//       { label: "Privacy policy", href: "#" },
//       { label: "Terms of use", href: "#" },
//     ],
//   },
// ];
