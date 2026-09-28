import { Award, HeartHandshake, Globe2 } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";

interface Reason {
  icon: typeof Award;
  title: string;
  text: string;
}

const reasons: Reason[] = [
  {
    icon: Award,
    title: "25 Years of Proven Market Leadership",
    text: "Proven track record in luxury hospitality and key industry sectors across Cyprus.",
  },
  {
    icon: HeartHandshake,
    title: "360° Support for Candidates & Employers",
    text: "Dual-focused approach that balances employer requirements with candidate well-being.",
  },
  {
    icon: Globe2,
    title: "Deep Local & EU Recruitment Networks",
    text: "Seamless cross-border talent acquisition tailored specifically for EU citizens.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="section-spacing">
      <div className="container-site">
        <SectionHeader eyebrow="Why Choose Us" title="Why Choose Us?" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[30px]">
          {reasons.map(({ icon: Icon, title, text }, index) => (
            <Reveal
              key={title}
              delay={index * 100}
              className="flex h-full flex-col rounded-card border border-gray-3 bg-white p-6 sm:p-[30px]"
            >
              <span className="mb-6 flex size-14 items-center justify-center rounded-sm-card bg-primary/10 text-primary lg:mb-8">
                <Icon className="size-7" strokeWidth={1.5} />
              </span>
              <h3 className="mb-2 text-xl font-semibold text-ink">{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
