"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
  /** Id of the item that starts expanded. */
  defaultOpenId?: string;
  className?: string;
}

/** Expandable question/answer list; every item toggles independently. */
export default function Accordion({ items, defaultOpenId, className = "" }: AccordionProps) {
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(
    () => new Set(defaultOpenId ? [defaultOpenId] : []),
  );

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <div className={className}>
      {items.map(({ id, question, answer }) => {
        const isOpen = openIds.has(id);
        return (
          <div key={id} className="border-b border-line">
            <h3>
              <button
                type="button"
                onClick={() => toggle(id)}
                aria-expanded={isOpen}
                aria-controls={`${id}-panel`}
                className="flex w-full items-center justify-between gap-4 py-5 text-left font-body text-lg font-medium text-ink sm:text-xl"
              >
                {question}
                <motion.span
                  animate={{ rotate: isOpen ? 135 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex size-9 flex-none items-center justify-center rounded-full bg-gray-3 text-ink"
                >
                  <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
                </motion.span>
              </button>
            </h3>
            <motion.div
              id={`${id}-panel`}
              initial={false}
              animate={{ height: isOpen ? "auto" : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <p className="pb-5">{answer}</p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
