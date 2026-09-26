import Image from "next/image";
import { CircleCheck } from "lucide-react";
import Reveal from "@/components/motion/Reveal";
import { missionPoints } from "@/lib/data";

export default function Mission() {
  return (
    <section className="pb-[60px] md:pb-[75px] lg:pb-[90px]">
      <div className="container-site">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-20">
          <Reveal>
            <h2 className="mb-8 text-3xl sm:text-4xl lg:mb-[50px] lg:text-5xl">
              Our mission is to make hiring honest and simple.
            </h2>
            <ul className="flex flex-col gap-5 lg:gap-8">
              {missionPoints.map((point) => (
                <li key={point.title} className="flex gap-4">
                  <CircleCheck className="mt-1 size-6 flex-none text-primary" />
                  <div>
                    <h3 className="mb-1 text-xl">{point.title}</h3>
                    <p>{point.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="grid grid-cols-2 gap-5 lg:gap-[30px]">
            <Reveal className="relative aspect-[3/4] overflow-hidden rounded-card bg-gray-3">
              <Image
                src="/images/about/mission-1.png"
                alt="Mission photo 1 — candidate preparing for an interview at home (~600×800)"
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
            </Reveal>
            <Reveal className="relative mt-10 aspect-[3/4] overflow-hidden rounded-card bg-gray-3 lg:mt-20">
              <Image
                src="/images/about/mission-2.png"
                alt="Mission photo 2 — hiring manager welcoming a new team member (~600×800)"
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
            </Reveal>
          </div>
        </div>

        <Reveal as="h2" className="mx-auto mt-14 max-w-[980px] text-center text-2xl leading-snug sm:text-3xl lg:mt-20 lg:text-4xl">
          Every role on Work Buckle is <span className="text-primary">real, current, and clearly paid</span>, so
          your time goes into applying, not guessing.
        </Reveal>
      </div>
    </section>
  );
}
