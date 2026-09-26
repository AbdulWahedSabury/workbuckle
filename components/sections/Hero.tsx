import Image from "next/image";
import ArrowButton from "@/components/ui/ArrowButton";
import { heroStats } from "@/lib/data";

const heroImages = [
  {
    src: "/images/hero-1.png",
    alt: "Hero portrait 1 — smiling job seeker holding a laptop (tall pill crop, ~400×540)",
    height: "h-[180px] sm:h-[240px] lg:h-[270px]",
    lines: "top" as const,
  },
  {
    src: "/images/hero-2.png",
    alt: "Hero portrait 2 — professional in a modern office, center feature image (tall pill crop, ~400×700)",
    height: "h-[240px] sm:h-[310px] lg:h-[350px]",
    lines: "both" as const,
  },
  {
    src: "/images/hero-3.png",
    alt: "Hero portrait 3 — team member collaborating at a desk (tall pill crop, ~400×540)",
    height: "h-[180px] sm:h-[240px] lg:h-[270px]",
    lines: "bottom" as const,
  },
];

function Line() {
  return <div className="mx-auto h-6 w-0.5 bg-gray-3 sm:h-10" aria-hidden="true" />;
}

export default function Hero() {
  return (
    <section className="pt-8 lg:pt-[50px]">
      <div className="container-site">
        <h1 className="mb-2.5 w-full text-[40px] leading-[1.2em] sm:text-[52px] lg:w-[70%] lg:text-[60px] lg:leading-[1.3em]">
          Find work that fits your life, and a team that fits you.
        </h1>

        <div className="mt-5 grid grid-cols-1 items-end gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-[100px]">
          {/* Left: copy, CTA, counters */}
          <div className="flex flex-col gap-10 lg:gap-[100px]">
            <div className="flex flex-col items-start gap-2.5">
              <p className="mb-5 max-w-[460px] text-lg">
                Work Buckle brings verified openings from growing companies into one place, so you can
                spend less time searching and more time interviewing.
              </p>
              <ArrowButton href="#jobs" label="Browse open roles" variant="primary" />
            </div>

            <div>
              <p className="mb-6 font-bold text-ink lg:mb-[30px]">Trusted by candidates and hiring teams</p>
              <div className="grid grid-cols-3 gap-5">
                {heroStats.map((stat) => (
                  <div key={stat.label}>
                    <p className="font-heading text-[32px] leading-[1.3em] font-semibold text-ink sm:text-[40px] lg:text-[48px]">
                      {stat.value}
                    </p>
                    <p className="text-sm sm:text-base">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: three pill-shaped portraits with connector lines */}
          <div className="relative z-10 grid grid-cols-3 items-start gap-3 sm:gap-5 lg:-mr-5">
            {heroImages.map((img) => (
              <div key={img.src} className="flex flex-col items-center">
                {(img.lines === "top" || img.lines === "both") && <Line />}
                <div className={`relative w-full overflow-hidden rounded-full bg-gray-3 ${img.height}`}>
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 1024px) 18vw, 30vw"
                    className="object-cover"
                    preload
                  />
                </div>
                {(img.lines === "bottom" || img.lines === "both") && <Line />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
