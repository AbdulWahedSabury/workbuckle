import Image from "next/image";
import Reveal from "@/components/motion/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import { useTranslations } from "next-intl";

interface Column {
  eyebrow?: string;
  title: string;
  text: string;
  img: string;
  points: string[];
}

const missionColumn: Column = {
  title: "For Employers: Tailored Workforce Solutions",
  text: "Finding the right personnel for luxury hospitality and high-stakes operations requires more than matching keywords on a resume.",
  img: "/images/about/comapny.png",
  points: [
    "Deep Industry Knowledge: 25 years of market intelligence ensures precise candidate selection aligned with your brand standards.",
    "End-to-End Screening: We vet and pre-screen candidates for skill, mindset, and cultural fit before they ever reach your interview room.",
    "Reliable EU Talent Pipelines: We bridge the gap between Cyprus’s premier employers and qualified professionals across Europe.",
  ],
};

const visionColumn: Column = {
  title: "For Candidates: Complete Career Support",
  text: "Moving to a new country or stepping into a new role is a life-changing decision. We stand by our candidates as active advisors throughout the entire transition.",
  img: "/images/about/employees.jpg",
  points: [
    "Needs-First Matching: We take the time to understand your individual career goals, lifestyle preferences, and salary expectations.",
    "Relocation & Onboarding Guidance: From navigating local paperwork to settling into your new role, we provide ongoing support.",
    "Transparent Communication: Clear contracts, honest advice, and direct feedback at every stage of the recruitment process.",
  ],
};

function ColumnCopy({ column }: { column: Column }) {
  const t = useTranslations("pages.about");
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
  return (
    <section className="section-spacing">
      <div className="container-site">
        <SectionHeader eyebrow="Our Partners" title="How We Serve Our Partners & Candidates" description="" />
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