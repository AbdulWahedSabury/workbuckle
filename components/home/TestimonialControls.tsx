"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { fadeUp, snappySpring } from "@/lib/motion";

interface TestimonialControlsProps {
  names: string[];
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}

export default function TestimonialControls({ names, index, onPrev, onNext, onSelect }: TestimonialControlsProps) {
  return (
    <motion.div variants={fadeUp} className="flex items-center gap-3">
      <motion.button
        type="button"
        onClick={onPrev}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.98 }}
        className="flex size-12 items-center justify-center rounded-full border border-ink text-ink"
        aria-label="Previous testimonial"
      >
        <ArrowLeft className="size-5" />
      </motion.button>
      <motion.button
        type="button"
        onClick={onNext}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.98 }}
        className="flex size-12 items-center justify-center rounded-full bg-ink text-white"
        aria-label="Next testimonial"
      >
        <ArrowRight className="size-5" />
      </motion.button>
      <div className="ml-3 flex gap-2" role="tablist" aria-label="Choose testimonial">
        {names.map((name, i) => (
          <motion.button
            key={name}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show testimonial from ${name}`}
            onClick={() => onSelect(i)}
            whileTap={{ scale: 0.9 }}
            animate={{ width: i === index ? 28 : 10 }}
            transition={snappySpring}
            className={`h-2.5 rounded-full ${i === index ? "bg-primary" : "bg-ink/20"}`}
          />
        ))}
      </div>
    </motion.div>
  );
}
