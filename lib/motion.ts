import type { Transition, Variants } from "framer-motion";

/* Shared framer-motion presets. Plain data, so safe to import from any module. */

export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;

export const spring: Transition = { type: "spring", stiffness: 100, damping: 15 };
export const snappySpring: Transition = { type: "spring", stiffness: 400, damping: 25 };

/** Parent: reveals its children one after another. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

/** Child: fades in while rising 30px. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT_QUART } },
};

/** Arrow chip that nudges outward when its parent is hovered or focused. */
export const arrowOut: Variants = {
  rest: { x: 0, y: 0 },
  hover: { x: 3, y: -3, transition: snappySpring },
};
