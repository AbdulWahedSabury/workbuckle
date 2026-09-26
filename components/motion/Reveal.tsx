"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Scroll-triggered entrance animations, matching the reference site's Webflow presets:
 * - slideInBottom: opacity 0 → 1, translateY 100px → 0
 * - growIn:        opacity 0 → 1, scale 0.75 → 1
 * Both run for 1000ms with an outQuart ease, once, when the element is `offset` into the viewport.
 */
type Effect = "slideInBottom" | "growIn";

const hiddenStyle: Record<Effect, string> = {
  slideInBottom: "translate3d(0, 100px, 0)",
  growIn: "scale(0.75)",
};

interface RevealProps {
  children: ReactNode;
  effect?: Effect;
  /** ms before the animation starts once triggered */
  delay?: number;
  /** how far (in % of viewport height) the element must scroll in before triggering */
  offset?: number;
  as?: ElementType;
  className?: string;
}

export default function Reveal({
  children,
  effect = "slideInBottom",
  delay = 100,
  offset = 10,
  as: Tag = "div",
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced-motion users see content immediately via a CSS override in globals.css.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: `0px 0px -${offset}% 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [offset]);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : hiddenStyle[effect],
        transition: "opacity 1000ms var(--ease-out-quart), transform 1000ms var(--ease-out-quart)",
        transitionDelay: visible ? `${delay}ms` : "0ms",
        willChange: visible ? undefined : "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}
