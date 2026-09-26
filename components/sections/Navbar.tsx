"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, ShoppingBag, X } from "lucide-react";
import ArrowButton from "@/components/ui/ArrowButton";
import { navLinks, pageLinks } from "@/lib/data";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the desktop dropdown on outside click.
  useEffect(() => {
    if (!pagesOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setPagesOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [pagesOpen]);

  // Lock page scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="relative z-50 bg-transparent py-4 lg:py-5">
      <div className="container-site grid grid-cols-[1fr_auto] items-center gap-5 lg:grid-cols-[1fr_auto_1fr]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" aria-label="Work Buckle home">
          <Image
            src="/images/logo.png"
            alt="Work Buckle logo mark — orange magnifier speech bubble with black WB monogram"
            width={44}
            height={44}
            className="size-10 object-contain lg:size-11"
            preload
          />
          <span className="font-heading text-xl font-semibold tracking-wide text-ink uppercase">
            Work Buckle
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center lg:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-5 py-5 font-heading text-base font-medium text-ink transition-colors duration-300 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setPagesOpen((o) => !o)}
              aria-expanded={pagesOpen}
              aria-haspopup="true"
              className="flex items-center gap-1 px-5 py-5 font-heading text-base font-medium text-ink transition-colors duration-300 hover:text-primary"
            >
              Pages
              <ChevronDown
                className={`size-4 transition-transform duration-300 ${pagesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {pagesOpen && (
              <div className="absolute top-full left-1/2 w-[420px] -translate-x-1/2 rounded-sm-card border border-line bg-white p-8 shadow-[0_20px_60px_-20px_rgba(14,14,14,0.25)]">
                <div className="grid grid-cols-2 gap-x-10 gap-y-3">
                  {pageLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setPagesOpen(false)}
                      className="text-gray-2 transition-colors duration-300 hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right actions */}
        <div className="flex items-center justify-end gap-3 sm:gap-5">
          <button
            type="button"
            className="relative flex size-11 items-center justify-center rounded-full bg-gray-3 text-ink transition-colors hover:bg-primary"
            aria-label="Open cart (0 items)"
          >
            <ShoppingBag className="size-5" />
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
              0
            </span>
          </button>
          <ArrowButton href="/#pricing" label="Post a job" className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-11 items-center justify-center rounded-full bg-ink text-white lg:hidden"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 bg-ink/50 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 right-0 z-50 flex h-dvh w-full max-w-[380px] flex-col bg-white p-6 transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Mobile menu"
        aria-hidden={!mobileOpen}
      >
        <div className="mb-8 flex items-center justify-between">
          <span className="font-heading text-lg font-semibold tracking-wide text-ink uppercase">Menu</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex size-11 items-center justify-center rounded-full bg-gray-3 text-ink"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-col" aria-label="Mobile">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="border-b border-line py-4 font-heading text-lg font-medium text-ink"
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setPagesOpen((o) => !o)}
            aria-expanded={pagesOpen}
            className="flex items-center justify-between border-b border-line py-4 font-heading text-lg font-medium text-ink"
          >
            Pages
            <ChevronDown className={`size-5 transition-transform ${pagesOpen ? "rotate-180" : ""}`} />
          </button>
          {pagesOpen && (
            <div className="grid grid-cols-2 gap-3 py-4">
              {pageLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-gray-2"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
        <ArrowButton href="/#pricing" label="Post a job" className="mt-auto self-start" />
      </aside>
    </header>
  );
}
