"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { MotionLink } from "@/components/motion/MotionLink";
import MobileMenu from "@/components/layout/MobileMenu";
import Logo from "@/components/ui/Logo";
import { NAV_LINKS } from "@/constants/menu";
import { EASE_OUT_QUART } from "@/lib/motion";
import { useRoot } from "@/hooks/use-root";
import SocialLinks from "./SocialLinks";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations("navigation");
  const reduceMotion = useReducedMotion();
  const isHome = useRoot();

  // Only inner pages have a sticky header that reacts to scroll.
  useEffect(() => {
    if (isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Close the mobile menu when the viewport grows to desktop.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const positionClasses = isHome
    ? "absolute inset-x-0 top-0 bg-transparent lg:top-10"
    : `sticky top-0 border-b bg-white/90 backdrop-blur-md ${
        scrolled ? "border-ink/10 shadow-sm" : "border-transparent"
      }`;

  return (
    <header
      className={`z-50 w-full text-ink transition-[background-color,border-color,box-shadow] duration-300 ${positionClasses}`}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT_QUART }}
        className="container-site flex h-16 items-center justify-between gap-4 lg:grid lg:h-20 lg:grid-cols-[1fr_auto_1fr] lg:gap-6"
      >
        <div className="flex min-w-0 shrink items-center">
          <Logo />
        </div>

        <nav className="hidden items-center lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <MotionLink
              key={link.href}
              href={link.href}
              whileTap={{ scale: 0.98 }}
              className="group relative whitespace-nowrap px-3 py-2 font-heading text-sm font-medium text-ink xl:px-4 xl:text-base"
            >
              {t(link.label)}
              <span
                aria-hidden="true"
                className="absolute inset-x-3 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100 xl:inset-x-4"
              />
            </MotionLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-3 sm:gap-4">
          <div className="hidden sm:flex lg:hidden xl:flex">
            <SocialLinks />
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setMenuOpen(true)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-white lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </motion.button>
        </div>
      </motion.div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={NAV_LINKS} />
    </header>
  );
}