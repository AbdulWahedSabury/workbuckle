import Reveal from "@/components/motion/Reveal";
import { useTranslations } from "next-intl";

/** `label` is a key under pages.about.stats in lang/*.json. */
const aboutStats = [
  { value: "2019", label: "founded" },
  { value: "40K+", label: "placed" },
  { value: "3.4K", label: "partners" },
  { value: "28", label: "countries" },
];

export default function AboutStats() {
  const t = useTranslations("pages.about.stats");
  return (
    <section className="section-spacing">
      <div className="container-site">
        <Reveal className="grid grid-cols-2 gap-8 rounded-card bg-gray-3 p-6 sm:p-10 lg:grid-cols-4 lg:p-[50px]">
          {aboutStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-start text-left text-sm sm:items-center sm:text-center sm:text-base"
            >
              <h2 className="mb-1 text-4xl lg:text-5xl">{stat.value}</h2>
              <p>{t(stat.label)}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
