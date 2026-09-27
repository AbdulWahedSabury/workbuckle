import { FileText, Video, Building2, CheckCircle2 } from "lucide-react";
import SectionHeader from "../ui/SectionHeader";
import RevealSection from "../motion/RevealSection";

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: typeof FileText;
  iconPosition: string;
  textPosition: string;
}

const STEPS: ProcessStep[] = [
  {
    number: "1",
    title: "Submit Your CV",
    description: "Complete the quick form below with your updated resume.",
    icon: FileText,
    iconPosition: "left-[8%] top-[55%]",
    textPosition: "left-[0%] top-[68%] md:max-w-[220px]",
  },
  {
    number: "2",
    title: "Initial Pre-Screening",
    description:
      "Our team conducts an introductory video interview to match your skills with the right employer.",
    icon: Video,
    iconPosition: "left-[35%] top-[18%]",
    textPosition: "left-[26%] top-[34%] md:max-w-[230px]",
  },
  {
    number: "3",
    title: "Employer Interview",
    description:
      "Meet directly with the hiring managers at the luxury resorts in Limassol or Nicosia.",
    icon: Building2,
    iconPosition: "left-[65%] top-[60%]",
    textPosition: "left-[55%] top-[72%] md:max-w-[230px]",
  },
  {
    number: "4",
    title: "Offer & Arrival",
    description:
      "Receive your formal contract, book your travel, and let us assist you with housing and onboarding.",
    icon: CheckCircle2,
    iconPosition: "left-[92%] top-[25%]",
    textPosition: "left-[80%] top-[40%] md:max-w-[230px]",
  },
];

export default function HowToApply() {
  return (
    <RevealSection className="py-[60px] md:py-[75px] lg:py-[90px] bg-white">
      <div className="container-site">
        <SectionHeader
          eyebrow="How to apply"
          title="Simple Application Process"
          description=""
        />
        <ol className="flex flex-col gap-10 md:hidden">
          {STEPS.map((step) => (
            <li key={step.number} className="relative flex gap-5">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-[0_16px_30px_-12px_rgba(200,106,59,0.35)]">
                <step.icon className="size-6" strokeWidth={2} />
              </div>
              <div>
                <span className="mb-1 block text-sm font-semibold tracking-wide text-gray-400">
                  Step {step.number}
                </span>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed text-gray-500">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="relative hidden md:block md:h-[480px] w-full">
          <svg
            className="absolute inset-0 size-full text-primary"
            viewBox="0 0 1000 300"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M 20 160 C 120 200, 260 55, 350 55 C 480 55, 550 180, 650 180 C 760 180, 840 75, 950 75 C 970 75, 985 80, 990 85"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {STEPS.map((step) => (
            <div key={step.number} className="contents">
              <div
                className={`absolute z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white text-primary shadow-[0_16px_30px_-12px_rgba(200,106,59,0.35)] ${step.iconPosition}`}
              >
                <step.icon className="size-7" strokeWidth={2} />
              </div>
              <div className={`absolute ${step.textPosition}`}>
                <div className="relative pt-4">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-8 right-0 text-8xl font-bold text-gray-200/70 select-none"
                  >
                    {step.number}
                  </span>
                  <h3 className="relative mb-2 text-xl font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="relative text-sm leading-relaxed text-gray-500">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </RevealSection>
  );
}
