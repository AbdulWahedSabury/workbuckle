"use client";

import { useRef } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import type { Role } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { iconButtonClass } from "../styles";
import AdminNav from "./AdminNav";
import SignOutButton from "./SignOutButton";
import ThemeToggle from "./ThemeToggle";
import ViewSiteLink from "./ViewSiteLink";

/**
 * Top bar + slide-in drawer for screens below `lg`. A modal <dialog> gives
 * focus trapping, Escape-to-close and an inert background without extra code.
 */
export default function AdminMobileNav({ user }: { user: { email: string; role: Role } }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => dialogRef.current?.close();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:hidden">
      <Logo href="/admin" />
      <button
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
        className={cn(iconButtonClass, "size-11 bg-gray-3 text-ink hover:bg-ink hover:text-white")}
      >
        <Menu aria-hidden="true" />
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Admin menu"
        // A click whose target is the <dialog> itself landed on the backdrop.
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-0 h-dvh max-h-none w-[min(20rem,85vw)] max-w-none bg-white p-0 transition-transform duration-300 ease-[var(--ease-out-quart)] backdrop:bg-black/50 starting:open:-translate-x-full motion-reduce:transition-none"
      >
        <div className="flex h-full flex-col gap-8 p-5">
          <div className="flex items-center justify-between">
            <Logo href="/admin" />
            <button
              type="button"
              aria-label="Close menu"
              onClick={close}
              className={cn(iconButtonClass, "size-11 bg-gray-3 text-ink")}
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <AdminNav role={user.role} onNavigate={close} />
          <div className="mt-auto flex flex-col gap-4">
            <ThemeToggle />
            <ViewSiteLink />
            <SignOutButton user={user} />
          </div>
        </div>
      </dialog>
    </header>
  );
}
