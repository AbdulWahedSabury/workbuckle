"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import type { NavLink } from "@/lib/home/types";
import { useRoot } from "@/hooks/use-root";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
}

export default function MobileMenu({ open, onClose, links }: MobileMenuProps) {
    const isHome = useRoot();
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
            aria-label="Mobile menu"
          >
            <div className="mb-8 flex items-center justify-between">
              <Logo />
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex size-11 items-center justify-center rounded-full bg-gray-3 text-ink"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </motion.button>
            </div>
            <motion.nav
              className="flex flex-col"
              aria-label="Mobile"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
            >
              {links.map((link) => (
                <motion.div key={link.label} variants={{ hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0 } }}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center justify-between border-b border-line py-4 font-heading text-lg font-medium text-ink"
                  >
                    {link.label}
                    <ArrowRight className="size-4 text-gray-2" />
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
