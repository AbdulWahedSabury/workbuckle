"use client";

import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import RevealSection from "../motion/RevealSection";
import AvailableCard from "./AvailableCard";
import SectionHeader from "../ui/SectionHeader";

const CATEGORIES = [
  "front_office",
  "food_&_beverage_culinary",
  "housekeeping_&_operations",
] as const;

export default function AvailablePositions() {
  const t = useTranslations("pages.home.available_jobs");

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: false,
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <RevealSection className="bg-gray-3 py-15 md:py-18.75 lg:py-22.5">
      <div className="container-site">
        {/* Header with Navigation Controls */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeader
            eyebrow={t("eyebrow")}
            title={t("title")}
            description=""
          />

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={scrollPrev}
              type="button"
              aria-label="Previous jobs"
              className="flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:bg-gray-100 hover:text-black focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={scrollNext}
              type="button"
              aria-label="Next jobs"
              className="flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:bg-gray-100 hover:text-black focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Slider Viewport */}
        <div className="mt-8 overflow-hidden" ref={emblaRef}>
          <div className="-ml-4 flex">
            {CATEGORIES.map((category) => (
              <div
                key={category}
                className="min-w-0 flex-[0_0_100%] pl-4 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
              >
                <AvailableCard category={category} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </RevealSection>
  );
}