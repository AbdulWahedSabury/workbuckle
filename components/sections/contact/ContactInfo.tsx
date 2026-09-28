import Link from "next/link";
import { AtSign, Globe, Mail, MapPin, Phone, Share2 } from "lucide-react";

const details = [
  { icon: Phone, label: "Phone", value: "(060) 444 434 444" },
  { icon: Mail, label: "Email", value: "hello@example.com" },
  { icon: MapPin, label: "Address", value: "Chicago HQ Estica Cop. Macomb, MI 48042" },
];

// Lucide 1.x no longer ships brand logos; swap these for brand SVGs if needed.
const socials = [
  { label: "Website", icon: Globe, href: "#" },
  { label: "Social profile", icon: AtSign, href: "#" },
  { label: "Share", icon: Share2, href: "#" },
  { label: "Email us", icon: Mail, href: "#" },
];

export default function ContactInfo() {
  return (
    <div className="flex h-full flex-col rounded-card bg-ink p-5 text-white sm:p-[30px] lg:p-10">
      <h2 className="mb-2 text-2xl sm:text-3xl text-white">Get in touch</h2>
      <p className="mb-8 text-white/70">Prefer to reach out directly? Here&apos;s how to find us.</p>

      <ul className="flex flex-col gap-5">
        {details.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex items-start gap-4">
            <span className="flex size-11 flex-none items-center justify-center rounded-full bg-white/10 text-primary">
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm text-white/50">{label}</p>
              <p className="font-semibold text-white">{value}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto grid grid-cols-4 gap-3 pt-10">
        {socials.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            aria-label={label}
            className="flex aspect-square items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-300 hover:bg-primary hover:text-ink"
          >
            <Icon className="size-5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
