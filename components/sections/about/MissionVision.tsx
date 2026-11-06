import Image from "next/image";
import Reveal from "@/components/motion/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import { useTranslations } from "next-intl";

interface Column {
  title: string;
  text: string;
  img: string;
  points: string[];
}

/** Text for each column lives under pages.about.partners.<key> in lang/*.json. */
const COLUMN_IMAGES = {
  employers: "/images/about/comapny.png",
  candidates: "/images/about/employees.jpg",
} as const;

type ColumnKey = keyof typeof COLUMN_IMAGES;

function useColumn(key: ColumnKey): Column {
  const t = useTranslations(`pages.about.partners.${key}`);
  return {
    title: t("title"),
    text: t("text"),
    img: COLUMN_IMAGES[key],
    points: t.raw("points") as string[],
  };
}

function ColumnCopy({ column }: { column: Column }) {
  return (
    <div>
      <h2 className="mb-4 text-2xl sm:text-3xl lg:text-4xl">{column.title}</h2>
      <p className="mb-6">{column.text}</p>
      <ul className="flex flex-col gap-3">
        {column.points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <span className="mt-2.5 size-1.5 flex-none rounded-full bg-ink" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MissionVision() {
  const t = useTranslations("pages.about.partners");
  const missionColumn = useColumn("employers");
  const visionColumn = useColumn("candidates");

  return (
    <section className="section-spacing">
      <div className="container-site">
        <SectionHeader eyebrow={t("eyebrow")} title={t("title")} description="" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-x-15 lg:gap-y-16">
          <Reveal className="flex flex-col gap-8">
            <ColumnCopy column={missionColumn} />
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card lg:mt-6">
              <Image
                src={missionColumn.img}
                alt={missionColumn.title}
                fill
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal className="flex flex-col gap-8" delay={150}>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card lg:aspect-[16/11]">
              <Image
                src={visionColumn.img}
                alt={visionColumn.title}
                fill
                className="object-cover"
              />
            </div>
            <ColumnCopy column={visionColumn} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
