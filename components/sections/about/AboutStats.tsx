import Reveal from "@/components/motion/Reveal";
import { aboutStats } from "@/lib/data";

export default function AboutStats() {
  return (
    <section className="section-spacing">
      <div className="container-site">
        <Reveal className="grid grid-cols-2 gap-8 rounded-card bg-gray-3 p-6 sm:p-10 lg:grid-cols-4 lg:p-[50px]">
          {aboutStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-start text-left text-sm sm:items-center sm:text-center sm:text-base"
            >
              <h2 className="mb-1 text-[36px] sm:text-[40px] lg:text-[48px]">{stat.value}</h2>
              <p>{stat.label}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
