"use client";

import { useCallback, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Header row with prev/next controls above a swipeable row of slides.
 * `children` are the slides, each already wrapped in its sizing cell.
 */
export default function CampaignCarousel({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
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
    <>
      {/* Header with Navigation Controls */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        {header}

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
        <div className="-ml-4 flex">{children}</div>
      </div>
    </>
  );
}
