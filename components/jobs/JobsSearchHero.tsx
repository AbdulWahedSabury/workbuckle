"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import RevealSection from "@/components/motion/RevealSection";
import FadeUp from "@/components/motion/FadeUp";
import HeroBackground from "../motion/HeroBackground";

export interface JobsSearchHeroProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const HERO_BG = "/images/hero/hospitality.png";

export default function JobsSearchHero({
  searchValue,
  onSearchChange,
  onSearchSubmit,
}: JobsSearchHeroProps) {
  const reduceMotion = useReducedMotion();
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <RevealSection className="relative bg-ink isolate overflow-hidden px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:pb-32 lg:pt-32">
      <HeroBackground src={HERO_BG} />
      <div className="container-site mx-auto max-w-7xl">
        <FadeUp className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-ink/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary backdrop-blur-md sm:px-4 sm:py-1.5 sm:text-[13px]">
            <span className="size-1.5 rounded-full bg-primary" />
            Jobs List
          </span>
          <h1 className="mt-5 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_24px_rgb(0_0_0/0.5)] sm:mt-6 sm:text-5xl lg:text-6xl">
            Explore our diverse range of{" "}
            <span className="text-primary">career opportunities</span>
          </h1>
        </FadeUp>
        <FadeUp className="mx-auto mt-8 max-w-2xl sm:mt-10">
          <form
            onSubmit={onSearchSubmit}
            role="search"
            className="group flex flex-col gap-2 rounded-2xl border border-white/15 bg-ink/50 p-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.7)] backdrop-blur-xl transition-colors duration-300 focus-within:border-primary/60 sm:flex-row sm:items-center sm:rounded-full"
          >
            <label className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-white sm:px-5">
              <Search
                className="size-5 flex-none text-white/50 transition-colors group-focus-within:text-primary"
                aria-hidden="true"
              />
              <span className="sr-only">Search jobs</span>
              <input
                type="search"
                value={searchValue}
                onChange={handleInputChange}
                placeholder="Search job title, company or keyword"
                className="w-full min-w-0 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none sm:text-base"
              />
            </label>
            <button
              type="submit"
              className="flex w-full flex-none items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 font-semibold text-ink transition-all duration-300 hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.98] sm:w-auto sm:rounded-full sm:py-3.5"
            >
              <span>Search</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </form>
        </FadeUp>
      </div>
    </RevealSection>
  );
}
