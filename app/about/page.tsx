import type { Metadata } from "next";
import AboutHero from "@/components/sections/about/AboutHero";
import AboutStats from "@/components/sections/about/AboutStats";
import Mission from "@/components/sections/about/Mission";
import ReviewMarquee from "@/components/sections/about/ReviewMarquee";
import AboutCta from "@/components/sections/about/AboutCta";

export const metadata: Metadata = {
  title: "About",
  description: "Why Work Buckle exists, what we stand for, and the people who use it every day.",
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutStats />
      <Mission />
      <ReviewMarquee />
      <AboutCta />
    </>
  );
}
