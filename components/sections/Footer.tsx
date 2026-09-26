"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, AtSign, Globe, Mail, Share2 } from "lucide-react";
import { footerLinks } from "@/lib/data";

// Lucide 1.x no longer ships brand logos; swap these for brand SVGs if needed.
const socials = [
  { label: "Website", icon: Globe, href: "#" },
  { label: "Social profile", icon: AtSign, href: "#" },
  { label: "Share", icon: Share2, href: "#" },
  { label: "Email us", icon: Mail, href: "#" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="pb-10 lg:pb-[50px]">
      <div className="container-site">
        <div className="mb-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_0.8fr] lg:gap-[50px]">
          <div>
            <Link href="/" className="mb-10 flex items-center gap-2.5 lg:mb-[60px]" aria-label="Work Buckle home">
              <Image
                src="/images/logo.png"
                alt="Work Buckle logo mark — orange magnifier speech bubble with black WB monogram"
                width={40}
                height={40}
                className="size-10 object-contain"
              />
              <span className="font-heading text-xl font-semibold tracking-wide text-ink uppercase">
                Work Buckle
              </span>
            </Link>

            <div className="grid grid-cols-1 gap-10 sm:grid-cols-[0.75fr_1fr] lg:gap-[50px]">
              <p className="max-w-[320px]">
                A job board for people who care about where they work, and teams who care about who they hire.
              </p>
              <div className="grid grid-cols-2 gap-8 lg:grid-cols-[1fr_1.25fr] lg:gap-[50px]">
                {footerLinks.map((group) => (
                  <div key={group.title}>
                    <h3 className="mb-6 text-lg sm:text-[22px]">{group.title}</h3>
                    <ul className="flex flex-col items-start gap-[15px]">
                      {group.links.map((l) => (
                        <li key={l.label}>
                          <Link
                            href={l.href}
                            className="text-ink opacity-80 transition-opacity duration-300 hover:opacity-100"
                          >
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-10 rounded-card bg-gray-3 p-5">
              <h3 className="mb-2 text-[22px]">Get new roles in your inbox</h3>
              <p className="mb-5">One email a week. Unsubscribe any time.</p>
              {subscribed ? (
                <p className="rounded-full bg-white px-6 py-4 font-semibold text-ink" role="status">
                  Thanks! You&apos;re on the list.
                </p>
              ) : (
                <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <label htmlFor="footer-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="footer-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full flex-1 rounded-full border border-line bg-white px-6 py-4 text-ink focus:border-ink focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="group inline-flex items-center justify-center gap-3 rounded-full bg-ink py-2 pr-2 pl-5 font-semibold text-white"
                  >
                    Subscribe
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary text-ink transition-transform duration-500 group-hover:rotate-45">
                      <ArrowUpRight className="size-4" />
                    </span>
                  </button>
                </form>
              )}
            </div>

            <div className="flex flex-row gap-5">
              {socials.map(({ label, icon: Icon, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex size-11 items-center justify-center rounded-full bg-gray-3 text-ink transition-colors hover:bg-primary"
                >
                  <Icon className="size-5" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-[30px] h-0.5 w-full bg-ink opacity-[0.07]" />

        <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} Work Buckle. All rights reserved.</p>
          <p>
            <Link href="#" className="text-gray-2 transition-colors hover:text-ink">Terms</Link>
            <span className="mx-2">·</span>
            <Link href="#" className="text-gray-2 transition-colors hover:text-ink">Privacy</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
