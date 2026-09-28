"use client";
import RevealSection from "../motion/RevealSection";
import AvailableCard from "./AvailableCard";
import SectionHeader from "../ui/SectionHeader";
import { useTranslations } from "next-intl";

export default function AvailablePositions() {
  const t = useTranslations("pages.home.available_jobs");
  return (
    <RevealSection className="py-15 md:py-18.75 lg:py-22.5 bg-gray-3">
      <div className="container-site">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description=""
        />
        <AvailableCard category="front_office" />
        <AvailableCard category="food_&_beverage_culinary" />
        <AvailableCard category="housekeeping_&_operations" />
      </div>
    </RevealSection>
  );
}
