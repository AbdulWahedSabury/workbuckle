"use client";

import { Fragment, isValidElement, useEffect, useRef, type ElementType, type ReactNode } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { useTranslations } from "next-intl";

import CountUp from "../ui/CountUp";
import Accent from "../ui/Accent";
import CtaButton from "@/components/ui/CtaButton";
import { HERO_IMAGES } from "@/constants/hero";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Cards on the ring. Your images repeat around it to fill the circle. */
const RING_COUNT = 8;
/** Seconds for one full turn of the ring. */
const SPIN_SECONDS = 50;
/** Max cursor tilt, in degrees. */
const TILT_X = 8;
const TILT_Y = 14;

/* ------------------------------------------------------------------ */
/* Motion variants                                                     */
/* ------------------------------------------------------------------ */

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};

// Headline words flip up on their baseline.
const wordFlip: Variants = {
  hidden: { y: "110%", rotateX: -85, opacity: 0 },
  show: { y: 0, rotateX: 0, opacity: 1, transition: { duration: 1.1, ease: EASE } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: EASE } },
};

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */

type StatItem = { value: number; suffix: string; label: string };

type RingCard = {
  key: string;
  src: string;
  alt: string;
  badge: [string, string];
  icon: unknown;
  pillBg?: string;
  /** Repeats exist only to fill the ring, so screen readers skip them. */
  decorative: boolean;
};

/** Renders the badge icon whether it is a component, an element or an image path. */
function BadgeIcon({ icon }: { icon: unknown }) {
  if (!icon) return null;
  if (isValidElement(icon)) return icon as ReactNode;
  if (typeof icon === "string") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt="" className="size-4" />;
  }
  const Icon = icon as ElementType;
  return <Icon className="size-4" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export default function HeroSection() {
  const t = useTranslations("pages.home.hero");
  const headline = t.raw("headline") as string[];
  const stats = t.raw("stats") as StatItem[];
  const reduceMotion = useReducedMotion();

  const baseCards = HERO_IMAGES.map((img) => ({
    src: img.src,
    alt: t(`images.${img.id}.alt`),
    badge: t.raw(`images.${img.id}.badge`) as [string, string],
    icon: img.icon as unknown,
    pillBg: typeof img.pillBg === "string" ? img.pillBg : undefined,
  }));

  const ringCards: RingCard[] = Array.from({ length: Math.max(RING_COUNT, baseCards.length) }, (_, i) => ({
    ...baseCards[i % baseCards.length],
    key: `${baseCards[i % baseCards.length].src}-${i}`,
    decorative: i >= baseCards.length,
  }));

  return (
    <section className="relative isolate overflow-hidden bg-ink pt-28 pb-16 text-white sm:pt-32 lg:pt-40 lg:pb-24">
      <Backdrop reduceMotion={!!reduceMotion} />

      <div className="container-site relative z-10 flex flex-col items-center text-center">
        {/* Headline */}
        <motion.h1
          initial="hidden"
          animate="show"
          variants={stagger}
          className="max-w-5xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl min-[1920px]:text-8xl text-white"
        >
          {headline.map((_, index) => (
            <Fragment key={index}>
              <span className="mb-[-0.12em] inline-block overflow-hidden pb-[0.12em] align-top">
                <motion.span
                  variants={wordFlip}
                  className="inline-block"
                  style={{ transformPerspective: 700, transformOrigin: "50% 100%" }}
                >
                  {t.rich(`headline.${index}`, {
                    accent: (chunks) => <Accent>{chunks}</Accent>,
                  })}
                </motion.span>
              </span>{" "}
            </Fragment>
          ))}
        </motion.h1>

        {/* Body + CTA */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.55 } } }}
          className="mt-6 flex flex-col items-center gap-8 sm:mt-8"
        >
          <motion.p variants={fadeUp} className="max-w-xl text-base text-white sm:text-lg">
            {t("body")}
          </motion.p>
          <motion.div variants={fadeUp}>
            <CtaButton href="/jobs">{t("cta.label")}</CtaButton>
          </motion.div>
        </motion.div>
      </div>

      {/* 3D ring */}
      <ImageRing cards={ringCards} reduceMotion={!!reduceMotion} />

      {/* Stats */}
      <div className="container-site relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2, ease: EASE }}
          className="mx-auto -mt-6 flex max-w-4xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:-mt-10 sm:p-8 md:flex-row md:items-center md:justify-between md:gap-10"
        >
          <p className="max-w-[14rem] text-left font-semibold text-white/80">{t("statsTitle")}</p>

          <dl className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2 md:divide-x md:divide-white/10">
            {stats.map((stat) => (
              <div key={stat.label} className="text-left md:px-8 md:first:pl-0">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-heading text-4xl font-semibold text-white md:text-5xl">
                  <CountUp to={stat.value} />
                  {stat.suffix}
                  <Accent>+</Accent>
                </dd>
                <dd className="mt-1 text-sm text-white/60">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3D image ring                                                       */
/* ------------------------------------------------------------------ */

function ImageRing({ cards, reduceMotion }: { cards: RingCard[]; reduceMotion: boolean }) {
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

function RingCardView({ card }: { card: RingCard }) {
  return (
    <figure className="group relative h-full w-full overflow-hidden rounded-[22px] border border-white/15 bg-white/5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]">
      <Image
        src={card.src}
        alt={card.decorative ? "" : card.alt}
        fill
        sizes="(min-width: 1024px) 210px, (min-width: 768px) 180px, 150px"
        className="object-cover"
      />

      {/* Readability gradient + glass sheen */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent opacity-60 mix-blend-overlay" />

      {/* Badge */}
      <figcaption className="absolute inset-x-2 bottom-2 sm:inset-x-3 sm:bottom-3">
        <div
          className={`flex items-center gap-2 rounded-2xl px-2.5 py-2 text-left backdrop-blur-md ${
            card.pillBg ?? "bg-white/15"
          }`}
        >
          <span className="grid size-7 flex-none place-items-center rounded-full bg-white text-ink">
            <BadgeIcon icon={card.icon} />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[11px] font-semibold text-white sm:text-xs">
              {card.badge[0]}
            </span>
            <span className="block truncate text-[10px] text-white/70 sm:text-[11px]">
              {card.badge[1]}
            </span>
          </span>
        </div>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Background                                                          */
/* ------------------------------------------------------------------ */

/** Background video. Swap the path for any video in /public. */
const HERO_VIDEO_SRC = "/images/hero-video-1.mp4";
/** Optional still shown while the video loads (and for reduced motion). */
const HERO_VIDEO_POSTER: string | undefined = undefined;

function Backdrop({ reduceMotion }: { reduceMotion: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Respect "reduce motion": keep the first frame as a still image.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reduceMotion) {
      video.pause();
    } else {
      // Some browsers block autoplay until the video is muted in JS too.
      video.muted = true;
      video.play().catch(() => {});
    }
  }, [reduceMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-80">
      {/* Video, fading in once it can play so it never flashes black */}
      <motion.video
        ref={videoRef}
        src={HERO_VIDEO_SRC}
        poster={HERO_VIDEO_POSTER}
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        // eslint-disable-next-line react/no-unknown-property -- iOS < 10 needs the non-standard attribute form too
        webkit-playsinline="true"
        preload="auto"
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease: EASE }}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}