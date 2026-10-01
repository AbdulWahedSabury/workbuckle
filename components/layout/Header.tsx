"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  useEffect(() => {
    if (isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const positionClasses = isHome
    ? "absolute inset-x-0 top-0 bg-transparent lg:top-10 text-white"
    : `sticky top-0 border-b bg-white/90 backdrop-blur-md text-ink ${
        scrolled ? "border-ink/10 shadow-sm" : "border-transparent"
      }`;

  return (
    <header
      className={`z-50 w-full  transition-[background-color,border-color,box-shadow] duration-300 ${positionClasses}`}
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
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <MotionLink
                key={link.href}
                href={link.href}
                whileTap={{ scale: 0.98 }}
                // 🚀 4. ADD DYNAMIC PADDING AND TEXT COLOR FOR THE ACTIVE STATE
                className={`group relative whitespace-nowrap py-2 pl-6 pr-3 font-heading text-sm font-medium xl:pl-7 xl:pr-4 xl:text-base transition-colors duration-200
                  ${isActive ? "text-primary" : " hover:text-primary"}
                `}
                aria-current={isActive ? "page" : undefined}
              >
                {t(link.label)}
                <span
                  aria-hidden="true"
                  className={`absolute left-1 top-1/2 h-4 w-0.5 -translate-y-1/2 rotate-12 origin-center rounded-full bg-primary transition-all duration-300 
                    ${isActive ? "scale-100" : "scale-0"}
                  `}
                />
              </MotionLink>
            );
          })}
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
