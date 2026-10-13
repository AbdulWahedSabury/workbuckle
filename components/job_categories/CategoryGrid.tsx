"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { stagger } from "@/lib/motion";

/**
 * Vertical shift (px) of each large-screen column, left to right. This is the
 * reference's "valley": the outer columns rise and the middle one sinks. The
 * grid has one column per entry and cards fill it row by row, so card `i` sits
 * in column `i % length`. Add or remove an entry to change the column count.
 */
const COLUMN_OFFSETS = [-100, 0, 50, 0, -100] as const;

export const CATEGORY_GRID_COLUMNS = COLUMN_OFFSETS.length;

/** Room below the grid for the deepest column, so it doesn't run into the next section. */
const MAX_DROP = Math.max(0, ...COLUMN_OFFSETS);

/**
 * Staggered category grid: 2 columns on phones, 3 on tablets, flat; from lg
 * one column per COLUMN_OFFSETS entry, shifted at half strength (so the raised
 * columns clear the centred heading on narrower screens) and in full from xl.
 * The shift is a CSS `translate`, so it never reflows the grid and composes
 * with the cards' own motion transforms.
 */
export function CategoryGrid({ children }: { children: ReactNode }) {
  const vars = {
    "--columns": `repeat(${CATEGORY_GRID_COLUMNS}, minmax(0, 1fr))`,
    "--max-drop": `${MAX_DROP}px`,
  } as CSSProperties;

  return (
    <motion.ul
      variants={stagger}
      style={vars}
      className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-(--columns) lg:gap-7.5 lg:pb-[calc(var(--max-drop)/2)] xl:mx-auto xl:w-[90%] xl:gap-12.5 xl:pb-(--max-drop)"
    >
      {children}
    </motion.ul>
  );
}

/** One grid cell, shifted by its column's offset from lg up. `index` is the card's position in the list. */
export function CategoryGridCell({ index, children }: { index: number; children: ReactNode }) {
  const offset = COLUMN_OFFSETS[index % CATEGORY_GRID_COLUMNS];

  return (
    <li
      style={{ "--offset": `${offset}px` } as CSSProperties}
      className="lg:translate-y-[calc(var(--offset)/2)] xl:translate-y-(--offset)"
    >
      {children}
    </li>
  );
}
