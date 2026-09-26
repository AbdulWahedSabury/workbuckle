import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Calculator,
  ChartLine,
  CodeXml,
  GraduationCap,
  Headphones,
  Megaphone,
  Palette,
  Stethoscope,
} from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
}

export const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Find Jobs", href: "/#jobs" },
  { label: "Companies", href: "/#companies" },
  { label: "Pricing", href: "/#pricing" },
];

export const pageLinks: NavLink[] = [
  { label: "About us", href: "/about" },
  { label: "Job details", href: "#" },
  { label: "Company profile", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Contact", href: "#" },
  { label: "FAQ", href: "#" },
  { label: "Sign in", href: "#" },
  { label: "Create account", href: "#" },
];

export const heroStats = [
  { value: "12K+", label: "Open roles" },
  { value: "3.4K", label: "Hiring teams" },
  { value: "98%", label: "Happy hires" },
];

export const searchCategories = [
  "Design & Creative",
  "Software Development",
  "Sales & Marketing",
  "Finance & Accounting",
  "Customer Support",
  "Healthcare",
];

export const jobTypes = [
  { title: "Full time", count: 1280 },
  { title: "Part time", count: 460 },
  { title: "Remote", count: 925 },
  { title: "Freelance", count: 310 },
];

export type JobType = "Full time" | "Part time" | "Remote" | "Freelance";

export interface Job {
  id: number;
  title: string;
  company: string;
  logo: string;
  type: JobType;
  category: string;
  location: string;
  salary: string;
  posted: string;
}

export const featuredJobs: Job[] = [
  {
    id: 1,
    title: "Senior Product Designer",
    company: "Northwind Studio",
    logo: "/images/companies/company-1.png",
    type: "Full time",
    category: "Design",
    location: "Lisbon, PT",
    salary: "$85k – $110k",
    posted: "2 days ago",
  },
  {
    id: 2,
    title: "Frontend Engineer (React)",
    company: "Brightlane",
    logo: "/images/companies/company-2.png",
    type: "Remote",
    category: "Engineering",
    location: "Anywhere",
    salary: "$95k – $130k",
    posted: "1 day ago",
  },
  {
    id: 3,
    title: "Growth Marketing Lead",
    company: "Harbor & Co.",
    logo: "/images/companies/company-3.png",
    type: "Full time",
    category: "Marketing",
    location: "Austin, US",
    salary: "$78k – $98k",
    posted: "4 days ago",
  },
  {
    id: 4,
    title: "Customer Success Associate",
    company: "Pinecrest",
    logo: "/images/companies/company-4.png",
    type: "Part time",
    category: "Support",
    location: "Toronto, CA",
    salary: "$28 / hour",
    posted: "Today",
  },
  {
    id: 5,
    title: "Brand Illustrator",
    company: "Kitefield",
    logo: "/images/companies/company-5.png",
    type: "Freelance",
    category: "Creative",
    location: "Remote",
    salary: "$60 / hour",
    posted: "3 days ago",
  },
  {
    id: 6,
    title: "Data Analyst",
    company: "Northwind Studio",
    logo: "/images/companies/company-1.png",
    type: "Remote",
    category: "Analytics",
    location: "Anywhere",
    salary: "$70k – $88k",
    posted: "5 days ago",
  },
];

export interface Company {
  name: string;
  logo: string;
  location: string;
  openings: number;
}

export const companies: Company[] = [
  { name: "Northwind Studio", logo: "/images/companies/company-1.png", location: "Lisbon, PT", openings: 14 },
  { name: "Brightlane", logo: "/images/companies/company-2.png", location: "Remote-first", openings: 22 },
  { name: "Harbor & Co.", logo: "/images/companies/company-3.png", location: "Austin, US", openings: 9 },
  { name: "Pinecrest", logo: "/images/companies/company-4.png", location: "Toronto, CA", openings: 17 },
  { name: "Kitefield", logo: "/images/companies/company-5.png", location: "Berlin, DE", openings: 6 },
];

export interface Category {
  title: string;
  icon: LucideIcon;
  openings: number;
}

export const categories: Category[] = [
  { title: "Development", icon: CodeXml, openings: 342 },
  { title: "Design", icon: Palette, openings: 188 },
  { title: "Marketing", icon: Megaphone, openings: 156 },
  { title: "Data & Analytics", icon: ChartLine, openings: 97 },
  { title: "Customer Support", icon: Headphones, openings: 121 },
  { title: "Finance", icon: Banknote, openings: 84 },
  { title: "Healthcare", icon: Stethoscope, openings: 132 },
  { title: "Accounting", icon: Calculator, openings: 65 },
  { title: "Education", icon: GraduationCap, openings: 73 },
];

export interface Plan {
  name: string;
  monthly: number;
  yearly: number;
  blurb: string;
  features: string[];
  highlighted?: boolean;
}

export const plans: Plan[] = [
  {
    name: "Starter",
    monthly: 0,
    yearly: 0,
    blurb: "For individuals starting their search.",
    features: ["Unlimited job browsing", "Save up to 10 jobs", "Weekly job alerts", "Basic profile"],
  },
  {
    name: "Professional",
    monthly: 19,
    yearly: 190,
    blurb: "For active job seekers who want an edge.",
    features: [
      "Everything in Starter",
      "Priority applications",
      "Daily tailored alerts",
      "Profile boost to recruiters",
      "Resume review each quarter",
    ],
    highlighted: true,
  },
  {
    name: "Business",
    monthly: 79,
    yearly: 790,
    blurb: "For teams hiring on a regular basis.",
    features: ["Up to 10 active listings", "Applicant tracking board", "Company profile page", "Team seats"],
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  image: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "I found a remote design role within three weeks. The filters were precise and every listing I saw was actually still open.",
    name: "Amara Okafor",
    role: "Product Designer",
    image: "/images/testimonials/review-1.png",
  },
  {
    quote:
      "We filled two engineering seats from one listing. The applicants matched the brief far better than on the big boards.",
    name: "Daniel Reyes",
    role: "Head of Engineering",
    image: "/images/testimonials/review-2.png",
  },
  {
    quote:
      "Switching careers felt daunting, but the category pages made it easy to see which roles valued my existing skills.",
    name: "Mei Tanaka",
    role: "Customer Success Manager",
    image: "/images/testimonials/review-3.png",
  },
];

export const footerLinks: { title: string; links: NavLink[] }[] = [
  {
    title: "For candidates",
    links: [
      { label: "Browse jobs", href: "/#jobs" },
      { label: "Categories", href: "/#categories" },
      { label: "Saved jobs", href: "#" },
      { label: "Career advice", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Contact", href: "#" },
      { label: "Privacy policy", href: "#" },
    ],
  },
];

/* ---------- About page ---------- */

export const aboutStats = [
  { value: "2019", label: "Founded" },
  { value: "40K+", label: "Candidates placed" },
  { value: "3.4K", label: "Partner companies" },
  { value: "28", label: "Countries served" },
];

export const missionPoints = [
  {
    title: "Only real, open roles",
    text: "Every listing is checked before it goes live and removed the moment it is filled.",
  },
  {
    title: "Clear pay, up front",
    text: "We ask employers to share salary ranges so candidates can decide quickly.",
  },
  {
    title: "People over pipelines",
    text: "Our team answers messages from candidates and recruiters alike, usually within a day.",
  },
];

export const marqueeReviews: { quote: string; name: string; role: string }[] = [
  { quote: "The cleanest job board I have used. No stale posts, no noise.", name: "Jonas Weber", role: "Backend Developer" },
  { quote: "We hired our first designer here in under a month.", name: "Priya Nair", role: "Startup Founder" },
  { quote: "Salary ranges on every card saved me hours of back and forth.", name: "Luca Romano", role: "Sales Lead" },
  { quote: "The weekly alerts are the only job emails I actually open.", name: "Sofia Álvarez", role: "UX Researcher" },
  { quote: "Posting a role took five minutes and the applicants were strong.", name: "Owen Clarke", role: "Talent Partner" },
  { quote: "Found a part-time role that fits around my studies perfectly.", name: "Hana Kim", role: "Student Analyst" },
];
