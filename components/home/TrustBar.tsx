import FadeUp from "@/components/motion/FadeUp";
import RevealSection from "@/components/motion/RevealSection";
import { TRUST_STATS } from "@/lib/home/data";

export default function TrustBar() {
  return (
    <RevealSection className="pb-[60px] lg:pb-[90px]">
      <div className="container-site">
        <FadeUp className="grid grid-cols-1 divide-y divide-line rounded-card border border-line bg-gray-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {TRUST_STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-4 p-6 lg:justify-center lg:p-8">
              <span className="flex size-12 flex-none items-center justify-center rounded-full bg-white text-primary">
                <Icon className="size-6" />
              </span>
              <div>
                <p className="font-heading text-[32px] leading-tight font-semibold tracking-tight text-ink lg:text-[40px]">
                  {value}
                </p>
                <p className="text-sm sm:text-base">{label}</p>
              </div>
            </div>
          ))}
        </FadeUp>
      </div>
    </RevealSection>
  );
}
