"use client";

import { useState } from "react";
import { Check, Crown, Rocket, Zap } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import ArrowButton from "@/components/ui/ArrowButton";
import { plans } from "@/lib/data";

const planIcons = [Zap, Crown, Rocket];

type Billing = "monthly" | "yearly";

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <section id="pricing" className="section-spacing">
      <div className="container-site">
        <SectionHeading align="center" className="!mb-6">
          Simple plans for every stage of your search
        </SectionHeading>

        <div className="mb-10 flex justify-center lg:mb-[50px]">
          <div role="tablist" aria-label="Billing period" className="inline-flex rounded-full bg-gray-3 p-1.5">
            {(["monthly", "yearly"] as const).map((b) => (
              <button
                key={b}
                type="button"
                role="tab"
                aria-selected={billing === b}
                onClick={() => setBilling(b)}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold capitalize transition-colors ${
                  billing === b ? "bg-ink text-white" : "text-ink"
                }`}
              >
                {b}
                {b === "yearly" && (
                  <span className={`ml-2 text-xs ${billing === b ? "text-primary" : "text-gray-2"}`}>
                    2 months free
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-[520px] grid-cols-1 gap-6 lg:max-w-none lg:grid-cols-3 lg:gap-10">
          {plans.map((plan, i) => {
            const Icon = planIcons[i] ?? Zap;
            const price = billing === "monthly" ? plan.monthly : plan.yearly;
            return (
              <div
                key={plan.name}
                className={`flex flex-col items-center rounded-card p-[30px] text-center ${
                  plan.highlighted ? "bg-primary lg:-translate-y-4" : "bg-gray-3"
                }`}
              >
                <div className="mb-1 flex items-center gap-1">
                  <Icon className="size-6 text-ink" />
                  <span className="font-heading text-[22px] leading-[1.5em] font-semibold text-ink">
                    {plan.name}
                  </span>
                </div>
                <p className={`mb-5 ${plan.highlighted ? "text-ink/70" : ""}`}>{plan.blurb}</p>
                <h3 className="mb-5 text-[36px] leading-[1.3em]">
                  ${price}
                  <span className="text-base font-medium text-gray-2">
                    {" "}
                    / {billing === "monthly" ? "month" : "year"}
                  </span>
                </h3>
                <div className={`h-px w-full ${plan.highlighted ? "bg-ink/15" : "bg-line"}`} />
                <ul className="mt-5 mb-[30px] flex flex-col items-center gap-[15px]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1 text-ink">
                      <Check className="mt-1 size-4 flex-none" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <ArrowButton
                  href="#"
                  label={plan.monthly === 0 ? "Start for free" : "Choose plan"}
                  variant={plan.highlighted ? "dark" : "primary"}
                  className="mt-auto"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
