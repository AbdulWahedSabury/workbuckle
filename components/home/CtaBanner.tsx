import FadeUp from "@/components/motion/FadeUp";
import RevealSection from "@/components/motion/RevealSection";
import Spin from "@/components/motion/Spin";
import CtaButton from "@/components/ui/CtaButton";

export default function CtaBanner() {
  return (
    <RevealSection className="section-spacing">
      <div className="container-site">
        <FadeUp className="relative isolate overflow-hidden rounded-card bg-ink px-6 py-12 sm:px-10 lg:px-[70px] lg:py-[80px]">
          <Spin className="absolute -top-28 -right-20 -z-10 size-80 rounded-full border-[36px] border-primary/25" />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 -left-16 -z-10 size-72 rounded-full bg-primary/15 blur-3xl"
          />
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-16">
            <div>
              <h2 className="mb-4 text-3xl tracking-tight text-white sm:text-5xl lg:text-6xl">
                Begin your new journey with us
              </h2>
              <p className="max-w-[560px] text-lg text-white/70">
                Build Your Career in Paradise: Luxury Hospitality Jobs in
                Cyprus.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <CtaButton href="#jobs" tone="primary">
                Browse Jobs
              </CtaButton>
            </div>
          </div>
        </FadeUp>
      </div>
    </RevealSection>
  );
}
