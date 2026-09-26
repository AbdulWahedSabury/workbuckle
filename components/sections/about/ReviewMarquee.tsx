"use client";

import { useState } from "react";
import { Pause, Play, Star } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import { marqueeReviews } from "@/lib/data";

export default function ReviewMarquee() {
  const [paused, setPaused] = useState(false);

  return (
    <Reveal as="section" className="overflow-hidden pb-[60px] md:pb-[75px] lg:pb-[90px]">
      <div className="container-site mb-8 flex items-end justify-between gap-6 lg:mb-[50px]">
        <h2 className="max-w-[640px] text-3xl sm:text-4xl lg:text-5xl">
          Loved by candidates and hiring teams
        </h2>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play reviews" : "Pause reviews"}
          className="flex size-12 flex-none items-center justify-center rounded-full border border-ink text-ink transition-colors hover:bg-ink hover:text-white"
        >
          {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
        </button>
      </div>

      {/* Slides to the last card over 30s, then back over 30s (see --animate-marquee in globals.css). */}
      <ul
        className={`flex w-max gap-5 px-4 animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none sm:gap-[50px] sm:px-6 lg:px-[30px] ${
          paused ? "[animation-play-state:paused]" : ""
        }`}
      >
        {marqueeReviews.map((r) => (
          <li key={r.name} className="w-[310px] flex-none rounded-card bg-gray-3 p-5 sm:w-[500px] sm:p-10">
            <div className="mb-5 flex gap-1" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-5 fill-primary text-primary" />
              ))}
            </div>
            <p className="mb-5 font-heading text-lg leading-normal text-ink sm:mb-[50px] sm:text-xl">
              &ldquo;{r.quote}&rdquo;
            </p>
            <h4 className="mb-0 text-xl">{r.name}</h4>
            <p>{r.role}</p>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
