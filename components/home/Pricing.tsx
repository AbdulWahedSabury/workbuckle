"use client";

import { useState } from "react";
import FadeUp from "@/components/motion/FadeUp";
import RevealSection from "@/components/motion/RevealSection";
import Stagger from "@/components/motion/Stagger";
import PlanCard from "@/components/home/PlanCard";
import CtaButton from "@/components/ui/CtaButton";
import SectionHeader from "@/components/ui/SectionHeader";
import { PLANS } from "@/lib/home/data";
import type { PlanId } from "@/lib/home/types";

export default function Pricing() {
  const [selected, setSelected] = useState<PlanId>("standard");
  const selectedPlan = PLANS.find((p) => p.id === selected);

  return (
    <RevealSection id="pricing" className="section-spacing">
      <div className="container-site">
        <SectionHeader
          eyebrow="Pricing"
          title="Choose your hiring plan"
          description="Simple, transparent pricing. Upgrade or cancel at any time."
          align="center"
        />

        <div role="radiogroup" aria-label="Hiring plans">
          <Stagger className="mx-auto grid max-w-[520px] grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-3 lg:gap-8">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selected === plan.id}
                onSelect={() => setSelected(plan.id)}
              />
            ))}
          </Stagger>
        </div>

        <FadeUp className="mt-10 flex justify-center">
          <CtaButton href="#">Continue with {selectedPlan?.name}</CtaButton>
        </FadeUp>
      </div>
    </RevealSection>
  );
}
