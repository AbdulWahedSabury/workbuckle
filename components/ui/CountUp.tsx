import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
const EASE = [0.25, 1, 0.5, 1] as const; // outQuart

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduceMotion) return;
    const controls = animate(0, to, {
      duration: 1.8,
      ease: EASE,
      onUpdate: (v) => (el.textContent = Math.round(v).toString()),
    });
    return () => controls.stop();
  }, [inView, reduceMotion, to]);

  // Server-render the final value so it's correct without JS and for crawlers.
  return <span ref={ref}>{to}</span>;
}