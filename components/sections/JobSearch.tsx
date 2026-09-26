"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, ChevronDown, MapPin, Search } from "lucide-react";
import { jobTypes, searchCategories } from "@/lib/data";

export default function JobSearch() {
  const [category, setCategory] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Hook up to your search route, e.g. router.push(`/jobs?q=${keyword}&loc=${location}&cat=${category}`)
  };

  return (
    <section className="relative -mt-16 sm:-mt-24 lg:-mt-[120px]">
      {/* Curved top edge, replaces the reference's decorative SVG */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="-mb-0.5 block h-[70px] w-full text-ink sm:h-[100px] lg:h-[140px]"
        aria-hidden="true"
      >
        <path d="M0 120V60C240 20 480 0 720 0s480 20 720 60v60H0Z" fill="currentColor" />
      </svg>

      <div id="jobs" className="bg-ink pt-8 pb-[60px] lg:pt-10 lg:pb-[90px]">
        <div className="container-site">
          <div className="relative z-20 mb-16 grid grid-cols-1 gap-8 lg:mb-[120px] lg:grid-cols-[0.75fr_1fr] lg:gap-[30px]">
            <div>
              <h2 className="mb-6 text-2xl text-white sm:text-[28px] lg:mb-10">
                Search by category
              </h2>
              <div ref={dropdownRef} className="relative w-full">
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={open}
                  className="flex w-full items-center justify-between rounded-full border border-gray-2 bg-gray-1 px-6 py-4 text-left text-white"
                >
                  <span className={category ? "" : "opacity-60"}>{category ?? "All categories"}</span>
                  <ChevronDown className={`size-5 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <ul
                    role="listbox"
                    className="absolute top-full right-0 left-0 mt-[15px] flex flex-col gap-[15px] rounded-sm-card border border-gray-2 bg-gray-1 p-5"
                  >
                    {searchCategories.map((c) => (
                      <li key={c}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={category === c}
                          onClick={() => {
                            setCategory(c);
                            setOpen(false);
                          }}
                          className={`w-full text-left transition-colors hover:text-primary ${
                            category === c ? "text-primary" : "text-white"
                          }`}
                        >
                          {c}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <p className="mb-5 text-white opacity-60">Or search by keyword and location</p>
              <form
                onSubmit={onSubmit}
                className="flex flex-col gap-3 rounded-[30px] bg-gray-1 p-3 sm:flex-row sm:items-center sm:rounded-full sm:p-2"
              >
                <label className="flex flex-1 items-center gap-3 px-4 py-2 text-white">
                  <Briefcase className="size-5 flex-none opacity-60" />
                  <span className="sr-only">Job title or keyword</span>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Job title or keyword"
                    className="w-full bg-transparent placeholder:text-white/60 focus:outline-none"
                  />
                </label>
                <span className="hidden h-8 w-px bg-gray-2 sm:block" aria-hidden="true" />
                <label className="flex flex-1 items-center gap-3 px-4 py-2 text-white">
                  <MapPin className="size-5 flex-none opacity-60" />
                  <span className="sr-only">Location</span>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City or remote"
                    className="w-full bg-transparent placeholder:text-white/60 focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-semibold text-ink transition-colors hover:bg-primary-dark"
                >
                  <Search className="size-5" />
                  Search
                </button>
              </form>
            </div>
          </div>

          <h3 className="mb-8 text-2xl text-white sm:text-[28px]">Browse by job type</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[30px]">
            {jobTypes.map((t) => (
              <Link
                key={t.title}
                href="#featured"
                className="group flex flex-col gap-6 rounded-card border border-gray-1 bg-gray-1 p-[30px] transition-colors duration-300 hover:border-primary"
              >
                <div>
                  <h4 className="mb-1 text-[22px] text-white">{t.title}</h4>
                  <p className="text-white/60">{t.count.toLocaleString()} open roles</p>
                </div>
                <span className="relative flex w-fit items-center gap-1.5 pb-1 font-semibold text-primary">
                  View roles
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
