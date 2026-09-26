import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ArrowButton from "@/components/ui/ArrowButton";
import { categories } from "@/lib/data";

export default function JobCategories() {
  return (
    <section id="categories" className="relative z-10">
      <div className="container-site">
        <div className="overflow-hidden rounded-card bg-ink">
          <div className="grid grid-cols-1 gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(200px,1fr)_0.4fr] lg:gap-[50px] lg:p-[50px]">
            {/* Heading column comes first on mobile, sits right on desktop */}
            <div className="flex flex-col items-start justify-between gap-8 lg:order-2">
              <h2 className="text-[32px] text-white sm:text-[40px] lg:text-[48px]">
                Explore roles by category
              </h2>
              <div>
                <p className="mb-6 text-white/60">
                  Nine career paths, hundreds of openings. Pick a field and see who is hiring today.
                </p>
                <ArrowButton href="#" label="All categories" variant="primary" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:order-1 xl:grid-cols-3 xl:gap-[30px]">
              {categories.map(({ title, icon: Icon, openings }) => (
                <Link
                  key={title}
                  href="#"
                  className="group flex h-full w-full flex-col rounded-card border border-gray-1 bg-gray-1 p-6 transition-colors duration-300 hover:border-primary sm:p-[30px]"
                >
                  <Icon className="mb-8 size-10 text-primary lg:mb-10" strokeWidth={1.5} />
                  <div className="flex flex-col items-start gap-6 lg:gap-[30px]">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{title}</h3>
                      <p className="text-white/60">{openings} openings</p>
                    </div>
                    <span className="flex items-center gap-1.5 font-semibold text-primary">
                      Explore
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
