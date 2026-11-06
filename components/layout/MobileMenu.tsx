"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Logo from "@/components/ui/Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import type { Menu } from "@/types/navigation";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  /** Labels are keys under `navigation` in lang/*.json, as in the desktop header. */
  links: Menu;
}

export default function MobileMenu({ open, onClose, links }: MobileMenuProps) {
  const t = useTranslations("navigation");
  const h = useTranslations("layout.header");
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-ink/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            key="drawer"
            className="fixed top-0 right-0 z-50 flex h-dvh w-full max-w-[380px] flex-col bg-white p-6 lg:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            aria-label={h("mobile_menu")}
          >
            <div className="mb-8 flex items-center justify-between">
              <Logo />
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex size-11 items-center justify-center rounded-full bg-gray-3 text-ink"
                aria-label={h("close_menu")}
              >
                <X className="size-5" />
              </motion.button>
            </div>
            <motion.nav
              className="flex flex-col"
              aria-label={h("mobile_nav")}
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
            >
              {links.map((link) => (
                <motion.div key={link.href} variants={{ hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0 } }}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center justify-between border-b border-line py-4 font-heading text-lg font-medium text-ink"
                  >
                    {t(link.label)}
                    <ArrowRight className="size-4 text-gray-2" />
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
            <LanguageSwitcher className="mt-8" onNavigate={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
