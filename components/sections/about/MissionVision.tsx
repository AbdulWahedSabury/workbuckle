import Reveal from "@/components/motion/Reveal";
import { useTranslations } from "next-intl";

interface Column {
  eyebrow?: string;
  title: string;
  text: string;
  points: string[];
}

const missionColumn: Column = {
  title: "Our core mission",
  text: "At the heart of everything we do is a commitment to excellence, innovation, and integrity. Our core mission is to deliver exceptional value to our customers while driving sustainable growth and making a positive impact on the world.",
  points: [
    "Deliver exceptional value to our customers.",
    "Drive innovation and continuous improvement.",
    "Foster a culture of integrity and transparency.",
    "Promote sustainable practices and growth.",
  ],
};

const visionColumn: Column = {
  title: "Vision & values",
  text: "Our vision is to lead purposefully, inspiring innovation and excellence in everything we do. Guided by our core values, we strive to create a positive impact on our industry, our customers, and the world.",
  points: [
    "Lead with innovation and excellence.",
    "Empower communities for a sustainable future.",
    "Revolutionize our industry with technology.",
    "Inspire change and drive progress.",
    "Improve lives and shape a better tomorrow.",
  ],
};

function ColumnCopy({ column }: { column: Column }) {
  const t = useTranslations('pages.about');
  return (
    <div>
      <h2 className="mb-4 text-2xl sm:text-3xl lg:text-4xl">{t("story_title")}</h2>
      <p className="mb-6">{t("story_first")}</p>
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

function Placeholder({ className }: { className: string }) {
  return <div className={`rounded-card bg-gray-3 ${className}`} />;
}

export default function MissionVision() {
  return (
    <section className="section-spacing">
      <div className="container-site">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-x-15 lg:gap-y-16">
          <Reveal className="flex flex-col gap-8">
            <ColumnCopy column={missionColumn} />
            <Placeholder className="aspect-[4/3] w-full lg:mt-6" />
          </Reveal>
          {/* Right column: large image up top, vision copy below */}
          <Reveal className="flex flex-col gap-8" delay={150}>
            <Placeholder className="aspect-[4/3] w-full lg:aspect-[16/11]" />
            <ColumnCopy column={visionColumn} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
