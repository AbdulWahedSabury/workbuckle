import { FooterColumn } from '@/types/footercolumn';

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
      title: "candidates",
      links: [
          { label: "jobs", href: "/jobs" },
      ],
  },
  {
      title: "company",
      links: [
          { label: "about", href: "/about" },
          { label: "privacy", href: "/privacy" },
          { label: "terms", href: "/terms" },
      ],
  },
];
