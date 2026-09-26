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
import SocialLinks from "./SocialLinks";
import { useRoot } from "@/hooks/use-root";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations("navigation");
  const reduceMotion = useReducedMotion();
  const isHome = useRoot();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <header
      className={`z-50 w-full transition-all duration-300 ${
        isHome ? "absolute top-0 left-0 text-ink lg:top-10 bg-transparent border-transparent" : "border-b border-transparent bg-white text-ink" }`}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT_QUART }}
        className={`container-site flex items-center justify-between gap-4 transition-[height] duration-300 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 ${
          scrolled ? "h-16 lg:h-18" : "h-16 sm:h-18 lg:h-20"
        }`}
      >
        <div className="flex min-w-0 shrink items-center">
          <Logo />
        </div>

        <nav className="hidden items-center lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <MotionLink
              key={link.label}
              href={link.href}
              whileTap={{ scale: 0.98 }}
              className={`group relative whitespace-nowrap px-2.5 py-2 font-heading font-medium xl:px-4  "text-ink"
              `}
            >
              {t(link.label)}
              <span className="absolute inset-x-2.5 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform duration-300 group-hover:scale-x-100 xl:inset-x-4" />
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
            <Menu className="size-5" />
          </motion.button>
        </div>
      </motion.div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={NAV_LINKS} />
    </header>
  );
}