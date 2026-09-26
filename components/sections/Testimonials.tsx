"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import { testimonials } from "@/lib/data";

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const count = testimonials.length;
  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  return (
    <section className="pb-[60px] md:pb-[75px] lg:pb-[90px]">
      <div className="container-site">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.5fr_minmax(200px,1fr)] lg:gap-[30px]">
          <div className="flex flex-col justify-between gap-8">
            <h2 className="text-[32px] sm:text-[40px] lg:text-[48px]">What our community says</h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous testimonial"
                className="flex size-12 items-center justify-center rounded-full border border-ink text-ink transition-colors hover:bg-ink hover:text-white"
              >
                <ArrowLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next testimonial"
                className="flex size-12 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-primary hover:text-ink"
              >
                <ArrowRight className="size-5" />
              </button>
              <span className="ml-2 text-sm text-gray-2" aria-live="polite">
                {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="overflow-hidden rounded-card">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {testimonials.map((t, i) => (
                <article
                  key={t.name}
                  aria-hidden={i !== index}
                  className="grid w-full flex-none grid-cols-1 items-center gap-6 sm:grid-cols-[0.75fr_1fr] lg:gap-[30px]"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-gray-3 sm:aspect-auto sm:h-full sm:min-h-[380px]">
                    <Image
                      src={t.image}
                      alt={`Portrait of ${t.name}, ${t.role} (reviewer photo, ~600×750)`}
                      fill
                      sizes="(min-width: 1024px) 28vw, (min-width: 640px) 40vw, 90vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="py-2">
                    <div className="mb-5 flex gap-1" aria-label="5 out of 5 stars">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className="size-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <Quote className="mb-4 size-8 text-gray-3" fill="currentColor" aria-hidden="true" />
                    <p className="mb-8 font-heading text-lg leading-[1.5em] text-ink sm:text-xl lg:mb-[50px]">
                      {t.quote}
                    </p>
                    <p className="font-heading text-[22px] leading-[1.3em] font-semibold text-ink">{t.name}</p>
                    <p>{t.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
