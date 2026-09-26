"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Quote, Star } from "lucide-react";
import type { Testimonial } from "@/lib/home/types";
import { EASE_OUT_QUART } from "@/lib/motion";

const SWIPE_THRESHOLD = 60;

const slide: Variants = {
  enter: (d: number) => ({ opacity: 0, x: d >= 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d >= 0 ? -60 : 60 }),
};

interface TestimonialCardProps {
  testimonial: Testimonial;
  /** 1 = came from the right, -1 = from the left. */
  direction: number;
  /** Called with 1 (next) or -1 (previous) after a horizontal drag. */
  onSwipe: (dir: number) => void;
}

export default function TestimonialCard({ testimonial, direction, onSwipe }: TestimonialCardProps) {
  return (
    <motion.article
      custom={direction}
      variants={slide}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.45, ease: EASE_OUT_QUART }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (info.offset.x < -SWIPE_THRESHOLD) onSwipe(1);
        else if (info.offset.x > SWIPE_THRESHOLD) onSwipe(-1);
      }}
      className="grid cursor-grab grid-cols-1 gap-6 p-5 active:cursor-grabbing sm:grid-cols-[0.8fr_1fr] sm:items-center sm:gap-8 sm:p-6 lg:p-8"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm-card bg-gray-3">
        <Image
          src={testimonial.image}
          alt={`Portrait of ${testimonial.name}, ${testimonial.role} (reviewer photo, ~600×750)`}
          fill
          sizes="(min-width: 1024px) 26vw, (min-width: 640px) 40vw, 90vw"
          className="pointer-events-none object-cover"
          draggable={false}
        />
      </div>
      <div>
        <div className="mb-5 flex gap-1" aria-label="Rated 5 out of 5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="size-5 fill-primary text-primary" />
          ))}
        </div>
        <Quote className="mb-3 size-9 text-primary/25" fill="currentColor" aria-hidden="true" />
        <blockquote className="mb-8 font-heading text-lg leading-[1.5em] font-medium text-ink sm:text-xl lg:text-[22px]">
          {testimonial.quote}
        </blockquote>
        <p className="font-heading text-[22px] font-semibold text-ink">{testimonial.name}</p>
        <p>{testimonial.role}</p>
      </div>
    </motion.article>
  );
}
