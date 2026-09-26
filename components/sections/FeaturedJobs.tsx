"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Banknote, Clock, MapPin } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import ArrowButton from "@/components/ui/ArrowButton";
import { featuredJobs, type JobType } from "@/lib/data";

const tabs: ("All" | JobType)[] = ["All", "Full time", "Part time", "Remote", "Freelance"];

export default function FeaturedJobs() {
  const [active, setActive] = useState<(typeof tabs)[number]>("All");
  const jobs = active === "All" ? featuredJobs : featuredJobs.filter((j) => j.type === active);

  return (
    <section id="featured" className="bg-gray-3 py-[60px] md:py-[75px] lg:py-[90px]">
      <div className="container-site">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading className="lg:mb-[50px]">Featured roles picked for this week</SectionHeading>
          <div
            role="tablist"
            aria-label="Filter by job type"
            className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 lg:mb-[50px]"
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active === tab}
                onClick={() => setActive(tab)}
                className={`flex-none rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                  active === tab
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-ink hover:border-ink"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href="#"
              className="group flex flex-col gap-6 rounded-card bg-white p-6 transition-transform duration-300 hover:-translate-y-1 sm:flex-row sm:items-start sm:p-[30px]"
            >
              <div className="flex size-[70px] flex-none items-center justify-center rounded-sm-card border border-line bg-white">
                <Image
                  src={job.logo}
                  alt={`${job.company} company logo (square, ~80×80)`}
                  width={40}
                  height={40}
                  className="size-10 rounded-lg object-contain"
                />
              </div>

              <div className="flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-ink">
                    {job.type}
                  </span>
                  <span className="rounded-full bg-gray-3 px-3 py-1 text-xs font-semibold text-ink">
                    {job.category}
                  </span>
                </div>
                <h3 className="mb-1 text-xl">{job.title}</h3>
                <p className="mb-5 text-gray-2">{job.company}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-[18px]" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Banknote className="size-[18px]" /> {job.salary}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-[18px]" /> {job.posted}
                  </span>
                </div>
              </div>

              <span className="hidden size-11 flex-none items-center justify-center rounded-full bg-gray-3 text-ink transition-all duration-300 group-hover:rotate-45 group-hover:bg-primary sm:flex">
                <ArrowUpRight className="size-5" />
              </span>
            </Link>
          ))}
          {jobs.length === 0 && (
            <p className="col-span-full rounded-card bg-white p-10 text-center">
              No featured roles of this type right now. Check back soon.
            </p>
          )}
        </div>

        <div className="mt-10 flex justify-center lg:mt-[50px]">
          <ArrowButton href="#" label="View all jobs" />
        </div>
      </div>
    </section>
  );
}
