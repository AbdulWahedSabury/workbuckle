"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import FadeUp from "@/components/motion/FadeUp";
import RevealSection from "@/components/motion/RevealSection";
import TestimonialCard from "@/components/home/TestimonialCard";
import TestimonialControls from "@/components/home/TestimonialControls";
import SectionHeader from "@/components/ui/SectionHeader";
import { TESTIMONIALS } from "@/lib/home/data";

/** Swipeable testimonial carousel. `direction` drives the slide-in side. */
export default function Testimonials() {
  const [[index, direction], setSlide] = useState<[number, number]>([0, 0]);
  const count = TESTIMONIALS.length;
  const current = TESTIMONIALS[index]!;

  const paginate = (dir: number) => setSlide(([i]) => [(i + dir + count) % count, dir]);
  const goTo = (i: number) => setSlide([i, i > index ? 1 : -1]);

  return (
    <RevealSection className="bg-gray-3 py-[60px] md:py-[75px] lg:py-[90px]">
      <div className="container-site">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.55fr_1fr] lg:gap-[50px]">
          <div className="flex flex-col justify-between gap-8">
            <SectionHeader
              eyebrow="Success stories"
              title="People who found their fit"
              description="Real feedback from candidates and hiring managers."
            />
            <TestimonialControls
              names={TESTIMONIALS.map((t) => t.name)}
              index={index}
              onPrev={() => paginate(-1)}
              onNext={() => paginate(1)}
              onSelect={goTo}
            />
          </div>

          <FadeUp className="relative overflow-hidden rounded-card bg-white">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <TestimonialCard
                key={current.name}
                testimonial={current}
                direction={direction}
                onSwipe={paginate}
              />
            </AnimatePresence>
          </FadeUp>
        </div>
      </div>
    </RevealSection>
  );
}
