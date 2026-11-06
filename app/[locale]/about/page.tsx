import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AboutHero from "@/components/sections/about/AboutHero";
import AboutStats from "@/components/sections/about/AboutStats";
import MissionVision from "@/components/sections/about/MissionVision";
import AboutCta from "@/components/sections/about/AboutCta";
import OurStory from "@/components/sections/about/OurStory";
import WhyChooseUs from "@/components/sections/about/WhyChooseUs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata.pages.about");
  return { title: t("title"), description: t("description") };
}

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
