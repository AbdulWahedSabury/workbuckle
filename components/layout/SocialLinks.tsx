"use client";

import type { ComponentType, SVGProps } from "react";
import { Mail, Phone } from "lucide-react";

import { MotionLink } from "@/components/motion/MotionLink";
import { snappySpring } from "@/lib/motion";

/* ------------------------------------------------------------------ */
/* Contact details: replace the placeholders with your real ones       */
/* ------------------------------------------------------------------ */

export const CONTACT = {
  facebook: "https://www.facebook.com/M.MAVROMATIEMPLOYMENT",
  instagram: "https://www.instagram.com/mavromatisemploymentbureau?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==",
  phone: "+357 00 000 000",
  email: "info@example.com",
};

/* ------------------------------------------------------------------ */
/* Brand icons (lucide-react no longer ships brand logos)              */
/* ------------------------------------------------------------------ */

type IconProps = SVGProps<SVGSVGElement>;

function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7.5h2.53l.38-2.94H13.5V8.69c0-.85.24-1.43 1.46-1.43h1.56V4.63a20.9 20.9 0 0 0-2.27-.12c-2.25 0-3.79 1.37-3.79 3.89v2.16H7.92v2.94h2.54V21h3.04Z" />
    </svg>
  );
}

function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Links                                                               */
/* ------------------------------------------------------------------ */

type ContactLink = {
  label: string;
  /** Text shown in the "contact" variant (the number, the address…). */
  value: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  external?: boolean;
};

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export const SOCIALS: ContactLink[] = [
  { label: "Facebook", value: "Facebook", href: CONTACT.facebook, icon: FacebookIcon, external: true },
  { label: "Instagram", value: "Instagram", href: CONTACT.instagram, icon: InstagramIcon, external: true },
  { label: "Call us", value: CONTACT.phone, href: telHref(CONTACT.phone), icon: Phone },
  { label: "Email us", value: CONTACT.email, href: `mailto:${CONTACT.email}`, icon: Mail },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface SocialLinksProps {
  /**
   * "icons": round icon buttons with a label tooltip (compact, e.g. header).
   * "contact": pills that also show the phone number and email (e.g. footer).
   */
  variant?: "icons" | "contact";
  className?: string;
}

export default function SocialLinks({ variant = "icons", className = "" }: SocialLinksProps) {
  if (variant === "contact") {
    return (
      <ul className={`flex flex-wrap gap-2.5 ${className}`}>
        {SOCIALS.map(({ label, value, href, icon: Icon, external }) => (
          <li key={label}>
            <MotionLink
              href={href}
              aria-label={`${label}: ${value}`}
              {...(external && { target: "_blank", rel: "noopener noreferrer" })}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={snappySpring}
              className="group inline-flex items-center gap-2.5 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-4 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-primary"
            >
              <span className="flex size-8 flex-none items-center justify-center rounded-full bg-gray-3 transition-colors group-hover:bg-primary group-hover:text-white">
                <Icon className="size-4" />
              </span>
              {value}
            </MotionLink>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={`flex gap-3 ${className}`}>
      {SOCIALS.map(({ label, value, href, icon: Icon, external }) => (
        <li key={label} className="group relative">
          <MotionLink
            href={href}
            aria-label={external ? label : `${label}: ${value}`}
            {...(external && { target: "_blank", rel: "noopener noreferrer" })}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.95 }}
            transition={snappySpring}
            className="flex size-11 items-center justify-center rounded-full bg-gray-3 text-ink transition-colors duration-200 hover:bg-primary hover:text-white focus-visible:bg-primary focus-visible:text-white focus-visible:outline-none"
          >
            <Icon className="size-5" />
          </MotionLink>

          {/* Tooltip */}
          <span
            role="presentation"
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          >
            {external ? label : value}
          </span>
        </li>
      ))}
    </ul>
  );
}