import type { Metadata } from "next";
import AboutHero from "@/components/sections/about/AboutHero";
import AboutStats from "@/components/sections/about/AboutStats";
import MissionVision from "@/components/sections/about/MissionVision";
import AboutCta from "@/components/sections/about/AboutCta";
import OurStory from "@/components/sections/about/OurStory";
import WhyChooseUs from "@/components/sections/about/WhyChooseUs";

export const metadata: Metadata = {
  title: "About",
  description: "Why Work Buckle exists, what we stand for, and the people who use it every day.",
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutStats />
      <OurStory />
      <MissionVision />
      <WhyChooseUs />
      <AboutCta />
    </>
  );
}
