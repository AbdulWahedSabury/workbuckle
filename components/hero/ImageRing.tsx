import { motion,useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import RingCardView from "./RingCardView";
const TILT_Y = 14;
const TILT_X = 8;
const SPIN_SECONDS = 50;
const EASE = [0.22, 1, 0.36, 1] as const;
type RingCard = {
  key: string;
  src: string;
  alt: string;
  badge: [string, string];
  icon: unknown;
  pillBg?: string;
  decorative: boolean;
};

export default function ImageRing({ cards, reduceMotion }: { cards: RingCard[]; reduceMotion: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);

  // Cursor position relative to the stage centre, -1..1, spring-smoothed.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 90, damping: 20, mass: 0.7 });
  const sy = useSpring(py, { stiffness: 90, damping: 20, mass: 0.7 });
  const rotateY = useTransform(sx, [-1, 1], [-TILT_Y, TILT_Y]);
  const rotateX = useTransform(sy, [-1, 1], [-6 + TILT_X, -6 - TILT_X]);

  useEffect(() => {
    if (reduceMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const onMove = (e: PointerEvent) => {
      const el = stageRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      px.set(Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2))));
      py.set(Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2))));
    };
    const onLeave = () => {
      px.set(0);
      py.set(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [reduceMotion, px, py]);

  const step = 360 / cards.length;

  return (
    <motion.div
      ref={stageRef}
      initial={{ opacity: 0, y: 80, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.6, delay: 0.7, ease: EASE }}
      className="relative mx-auto mt-10 h-[300px] w-full [--cw:120px] [--r:210px] sm:h-[380px] sm:[--cw:150px] sm:[--r:300px] md:mt-14 md:h-[440px] md:[--cw:180px] md:[--r:390px] lg:h-[500px] lg:[--cw:210px] lg:[--r:470px]"
      style={{ perspective: 1800, WebkitPerspective: 1800 }}
    >
      {/* Floor glow under the ring */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-4 mx-auto h-24 w-[70%] rounded-[100%] bg-primary/30 blur-3xl"
      />

      <motion.div
        className="absolute inset-0"
        style={{
          rotateX: reduceMotion ? -6 : rotateX,
          rotateY: reduceMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
        }}
      >
        {/* Ring pivot, centred in the stage */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d" }}
        >
          <motion.div
            style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d" }}
            animate={reduceMotion ? undefined : { rotateY: [0, -360] }}
            transition={{ duration: SPIN_SECONDS, repeat: Infinity, ease: "linear" }}
          >
            {cards.map((card, i) => (
              <div
                key={card.key}
                aria-hidden={card.decorative || undefined}
                className="absolute left-0 top-0 -ml-[calc(var(--cw)/2)] -mt-[calc(var(--cw)*2/3)] h-[calc(var(--cw)*4/3)] w-[var(--cw)]"
                style={{
                  transform: `rotateY(${i * step}deg) translateZ(var(--r))`,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <RingCardView card={card} />
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}