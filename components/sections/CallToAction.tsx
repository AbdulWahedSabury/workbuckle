import ArrowButton from "@/components/ui/ArrowButton";

export default function CallToAction() {
  return (
    <section className="pb-[60px] md:pb-[75px] lg:pb-[90px]">
      <div className="container-site">
        <div className="relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-card bg-primary p-6 sm:p-10 lg:grid-cols-[1fr_0.25fr] lg:gap-[50px] lg:p-[50px]">
          {/* Decorative rings echoing the logo's magnifier shape */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full border-[28px] border-ink/10"
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="mb-3 text-3xl sm:text-4xl lg:text-5xl">Your next role is one search away.</h2>
            <p className="max-w-[560px] text-ink/70">
              Create a free profile, set your alerts, and let the right openings come to you.
            </p>
          </div>
          <div className="relative flex lg:justify-end">
            <ArrowButton href="#" label="Get started" />
          </div>
        </div>
      </div>
    </section>
  );
}
