"use client";

import type { ChangeEvent, FormEvent } from "react";
import { Search } from "lucide-react";

import RevealSection from "@/components/motion/RevealSection";
import FadeUp from "@/components/motion/FadeUp";

export interface JobsSearchHeroProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Hero banner with the jobs list page's search form. */
export default function JobsSearchHero({
  searchValue,
  onSearchChange,
  onSearchSubmit,
}: JobsSearchHeroProps) {
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <RevealSection className="bg-ink px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28">
      <div className="container-site mx-auto max-w-7xl">
        <FadeUp className="mx-auto max-w-3xl text-center">
          <span className="mb-3 inline-flex items-center rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary sm:mb-4 sm:px-4 sm:py-1.5 sm:text-sm">
            Jobs List
          </span>
          <h1 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-6xl">
            Explore our diverse range of career opportunities
          </h1>
        </FadeUp>

        <FadeUp className="mx-auto mt-6 max-w-2xl sm:mt-10">
          <form
            onSubmit={onSearchSubmit}
            role="search"
            className="flex flex-col gap-2 rounded-2xl bg-gray-1 p-2 sm:flex-row sm:items-center sm:rounded-full sm:p-2"
          >
            <label className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-white sm:gap-3 sm:px-4">
              <Search className="size-5 flex-none opacity-60" aria-hidden="true" />
              <span className="sr-only">Search jobs</span>
              <input
                type="search"
                value={searchValue}
                onChange={handleInputChange}
                placeholder="Search job title, company or keyword"
                className="w-full min-w-0 bg-transparent text-sm placeholder:text-white/60 focus:outline-none sm:text-base"
              />
            </label>
            <button
              type="submit"
              className="flex w-full flex-none items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-ink transition-colors hover:bg-primary-dark sm:w-auto sm:rounded-full sm:py-3.5"
            >
              <Search className="size-5" aria-hidden="true" />
              <span>Search</span>
            </button>
          </form>
        </FadeUp>
      </div>
    </RevealSection>
  );
}
