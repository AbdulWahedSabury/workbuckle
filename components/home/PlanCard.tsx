"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { Plan } from "@/lib/home/types";
import { fadeUp, spring } from "@/lib/motion";

interface PlanCardProps {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}

export default function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -8 }}
      transition={spring}
      className={`relative flex flex-col rounded-card border-2 p-7 lg:p-[30px] ${
        selected ? "border-primary bg-white shadow-[0_30px_60px_-30px_rgba(252,112,28,0.45)]" : "border-transparent bg-gray-3"
      }`}
    >
      {plan.popular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-ink px-4 py-1 text-xs font-bold tracking-wide text-white uppercase">
          Most popular
        </span>
      )}
      <h3 className="mb-1 text-xl">{plan.name}</h3>
      <p className="mb-6">{plan.blurb}</p>
      <p className="mb-6 font-heading text-4xl leading-none font-semibold tracking-tight text-ink">
        {plan.price}
        <span className="ml-1.5 font-sans text-base font-medium tracking-normal text-gray-2">{plan.cadence}</span>
      </p>
      <ul className="mb-8 flex flex-col gap-3 border-t border-line pt-6">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-ink">
            <span className="mt-0.5 flex size-5 flex-none items-center justify-center rounded-full bg-primary/15 text-primary-dark">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <motion.button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={spring}
        className={`mt-auto flex items-center justify-center gap-2 rounded-full px-6 py-4 font-semibold ${
          selected ? "bg-primary text-ink" : "bg-ink text-white"
        }`}
      >
        {selected ? (
          <>
            <Check className="size-5" /> Selected
          </>
        ) : (
          <>Choose {plan.name}</>
        )}
      </motion.button>
    </motion.div>
  );
}
