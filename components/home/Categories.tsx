import FadeUp from "@/components/motion/FadeUp";
import RevealSection from "@/components/motion/RevealSection";
import Stagger from "@/components/motion/Stagger";
import CategoryCard from "@/components/home/CategoryCard";
import CtaButton from "@/components/ui/CtaButton";
import SectionHeader from "@/components/ui/SectionHeader";
import { CATEGORIES } from "@/lib/home/data";

export default function Categories() {
  return (
    <RevealSection id="categories" className="bg-ink py-[60px] md:py-[75px] lg:py-[90px]">
      <div className="container-site">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow="Categories"
            title="Explore jobs by industry"
            description="Pick a path and see every open role in that field."
            tone="light"
          />
          <FadeUp className="mb-10 lg:mb-[50px]">
            <CtaButton href="#jobs" tone="primary">
              All categories
            </CtaButton>
          </FadeUp>
        </div>

        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {CATEGORIES.map(({ title, icon: Icon, openings }) => (
            <CategoryCard
              key={title}
              href="#jobs"
              title={title}
              openings={openings}
              icon={<Icon className="size-7" strokeWidth={1.75} />}
            />
          ))}

          {/* Filler card completes the 4-column grid */}
          <FadeUp inView className="flex flex-col justify-between gap-6 rounded-card bg-primary p-6 lg:p-[30px]">
            <h3 className="text-2xl text-ink">Can&apos;t find your field?</h3>
            <p className="text-ink/70">Set up an alert and we&apos;ll tell you when a matching role goes live.</p>
            <CtaButton href="#" className="self-start">
              Create alert
            </CtaButton>
          </FadeUp>
        </Stagger>
      </div>
    </RevealSection>
  );
}
