"use client";

import { MotionLink } from "@/components/motion/MotionLink";
import { snappySpring } from "@/lib/motion";
import { SocialLink } from "@/types/socialLink";
import { AtSign, Globe, Mail, Share2 } from "lucide-react";
export const SOCIALS: SocialLink[] = [
  { label: "Website", icon: Globe, href: "https://mavromatisservices.com/" },
  { label: "Social profile", icon: AtSign, href: "#" },
  { label: "Share", icon: Share2, href: "#" },
  { label: "Email", icon: Mail, href: "#" },
];
export default function SocialLinks() {
  return (
    <div className="flex gap-3">
      {SOCIALS.map(({ label, icon: Icon, href }) => (
        <MotionLink
          key={label}
          href={href}
          aria-label={label}
          whileHover={{ y: -4, backgroundColor: "#fc701c" }}
          whileTap={{ scale: 0.95 }}
          transition={snappySpring}
          className="flex size-11 items-center justify-center rounded-full bg-gray-3 text-ink"
        >
          <Icon className="size-5" />
        </MotionLink>
      ))}
    </div>
  );
}
