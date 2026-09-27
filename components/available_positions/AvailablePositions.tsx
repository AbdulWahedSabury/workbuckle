"use client";
import RevealSection from "../motion/RevealSection";
import AvailableCard from "./AvailableCard";
import SectionHeader from "../ui/SectionHeader";
import { useTranslations } from "next-intl";

export default function AvailablePositions() {
  const t = useTranslations("pages.home.available_jobs");
  return (
    <RevealSection className="py-[60px] md:py-[75px] lg:py-[90px] bg-gray-3">
      <div className="container-site">
        <SectionHeader
          eyebrow="Our Partners"
          title={t("title")}
          description="Hotels with open seats right now."
        />
        <AvailableCard category="front_office" />
        <AvailableCard category="food_&_beverage_culinary" />
        <AvailableCard category="housekeeping_&_operations" />
      </div>
    </RevealSection>
  );
}
