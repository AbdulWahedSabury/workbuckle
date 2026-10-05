import Link from "next/link";
import { ArrowLeft, Briefcase, Home } from "lucide-react";

import RevealSection from "@/components/motion/RevealSection";
import FadeUp from "@/components/motion/FadeUp";
import CtaButton from "@/components/ui/CtaButton";
import SiteShell from "@/components/layout/SiteShell";

// No `metadata` export here: Next.js already marks not-found responses as
// noindex, and extra exports from this special file can trip the bundler.

export default function NotFound() {
  return (
    <SiteShell>
      <div className="w-full max-w-full overflow-x-hidden">
        <RevealSection className="relative isolate flex min-h-[80svh] items-center overflow-hidden bg-ink px-4 py-20 sm:px-6 lg:py-28">
          {/* Background: brand glow + faint grid, fading out at the edges */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-[-25%] h-[70%] w-[80%] -translate-x-1/2 rounded-[100%] bg-primary/20 blur-[140px]" />
            <div
              className="absolute inset-0 text-white/[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                backgroundSize: "56px 56px",
                maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
                WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
              }}
            />
          </div>

          <div className="container-site mx-auto max-w-7xl">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              {/* Oversized outlined 404 */}
              <FadeUp>
                <p
                  aria-hidden="true"
                  className="select-none font-heading text-[7rem] font-bold leading-none tracking-tighter text-transparent sm:text-[10rem] lg:text-[13rem]"
                  style={{ WebkitTextStroke: "2px rgb(255 255 255 / 0.18)" }}
                >
                  4<span className="text-primary [-webkit-text-stroke:0]">0</span>4
                </p>
              </FadeUp>

              <FadeUp className="mt-2">
                <span className="inline-flex items-center rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary sm:px-4 sm:py-1.5 sm:text-sm">
                  Page not found
                </span>
              </FadeUp>

              <FadeUp className="mt-5">
                <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  This page has moved on to a new opportunity
                </h1>
              </FadeUp>

              <FadeUp className="mt-4">
                <p className="max-w-md text-base text-white/70 sm:text-lg">
                  The link may be broken, or the role you were looking for has already been filled.
                  Plenty of others are still open.
                </p>
              </FadeUp>

              <FadeUp className="mt-10 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                <CtaButton href="/jobs" className="w-full justify-center sm:w-auto">
                  Browse open jobs
                </CtaButton>
                <Link
                  href="/"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                >
                  <ArrowLeft
                    className="size-4 transition-transform group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                  Back to home
                </Link>
              </FadeUp>

              {/* Quick links */}
              <FadeUp className="mt-12 w-full border-t border-white/10 pt-8">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">
                  Popular destinations
                </p>
                <nav aria-label="Popular pages" className="flex flex-wrap justify-center gap-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary hover:text-ink"
                  >
                    <Home className="size-4" aria-hidden="true" /> Home
                  </Link>
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary hover:text-ink"
                  >
                    <Briefcase className="size-4" aria-hidden="true" /> All jobs
                  </Link>
                </nav>
              </FadeUp>
            </div>
          </div>
        </RevealSection>
      </div>
    </SiteShell>
  );
}
