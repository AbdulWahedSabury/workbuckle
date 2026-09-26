"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ParallaxProps {
  children: ReactNode;
  /** translateY (in vh) when the element starts entering the viewport from below */
  from: number;
  /** translateY (in vh) when the element has fully left the viewport at the top */
  to: number;
  /** 0–100; higher = more easing lag, like Webflow's "smoothing" setting */
  smoothing?: number;
  className?: string;
}

/**
 * Moves its content vertically as it scrolls through the viewport
 * (the reference's "Image Scroll" continuous interaction).
 */
export default function Parallax({ children, from, to, smoothing = 90, className = "" }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const factor = 1 - Math.min(Math.max(smoothing, 0), 99) / 100;
    let current: number | null = null;
    let frame = 0;

    const target = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(Math.max((vh - rect.top) / (vh + rect.height), 0), 1);
      return from + (to - from) * progress;
    };

    const tick = () => {
      const t = target();
      current = current === null ? t : current + (t - current) * factor;
      el.style.transform = `translate3d(0, ${current.toFixed(3)}vh, 0)`;
      frame = Math.abs(t - current) > 0.01 ? requestAnimationFrame(tick) : 0;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [from, to, smoothing]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
