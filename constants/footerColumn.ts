import { FooterColumn } from '@/types/footercolumn';

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
      title: "For candidates",
      links: [
          { label: "jobs", href: "/jobs" },
          { label: "categories", href: "/categories" },
          { label: "companies", href: "/companies" },
      ],
      label: '',
      href: ''
  },
  {
      title: "Company",
      links: [
          { label: "about", href: "/about" },
          { label: "privacy", href: "/privacy" },
          { label: "terms", href: "/terms" },
      ],
      label: '',
      href: ''
  },
];
