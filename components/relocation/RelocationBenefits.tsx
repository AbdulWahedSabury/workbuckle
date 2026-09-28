"use client";

import { useTranslations } from "next-intl";
import RevealSection from "@/components/motion/RevealSection";
import FadeUp from "@/components/motion/FadeUp";

// Keep visual UI components (icons) in code
const BENEFIT_ICONS: Record<string, React.ReactNode> = {
  relocation: (
    <svg
      className="h-6 w-6 text-gray-100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.7 5.2c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
    </svg>
  ),
  accommodation: (
    <svg
      className="h-6 w-6 text-gray-100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  salaries: <span className="text-xl font-bold text-gray-100">€</span>,
  growth: (
    <svg
      className="h-6 w-6 text-gray-100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
};

const BENEFIT_KEYS = ["relocation", "accommodation", "salaries", "growth"] as const;

export default function RelocationBenefits() {
  const t = useTranslations("pages.home.relocationBenefits");

  return (
    <RevealSection className="bg-gray-3 py-[60px] md:py-[75px] lg:py-[90px]">
      <div className="container-site">
        <FadeUp className="rounded-card bg-white px-6 py-12 shadow-xl md:px-12 md:py-16">
          <h2 className="mb-12 text-center text-gray-900 md:text-3xl text-balance break-words text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {t("heading")}
          </h2>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {BENEFIT_KEYS.map((key) => (
              <div key={key} className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-sm">
                  {BENEFIT_ICONS[key]}
                </div>
                <h3 className="mb-3 whitespace-pre-line text-base font-bold leading-tight tracking-wide text-gray-900 md:text-lg">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="max-w-[260px] text-sm leading-relaxed text-gray-600">
                  {t(`items.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </RevealSection>
  );
}