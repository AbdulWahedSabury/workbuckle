import ArrowButton from "@/components/ui/ArrowButton";

/** Black panel that bleeds off the right edge of the viewport, as on the reference About page. */
export default function AboutCta() {
  return (
    <section className="relative overflow-hidden pb-[60px] md:pb-[75px] lg:pb-[90px]">
      <div className="container-site">
        <div className="relative isolate grid grid-cols-1 items-center gap-8 p-5 sm:p-[30px] md:grid-cols-[1fr_0.4fr] md:gap-[50px] md:px-[30px] md:py-10 lg:grid-cols-[1fr_0.25fr] lg:p-[50px] xl:gap-[150px] xl:px-[50px] xl:py-20 2xl:py-[90px] 2xl:pr-[130px] 2xl:pl-[90px]">
          <div
            className="absolute inset-y-0 left-0 -z-10 w-[calc(100%+7%)] rounded-l-card bg-ink md:w-screen md:rounded-l-[50px]"
            aria-hidden="true"
          />
          <div>
            <h2 className="mb-3 text-3xl text-white sm:text-4xl lg:text-5xl">
              Ready to take the next step?
            </h2>
            <p className="max-w-[560px] text-white/70">
              Join the candidates and companies who use Work Buckle to find each other every day.
            </p>
          </div>
          <div className="flex md:justify-end">
            <ArrowButton href="/#jobs" label="Find a job" variant="primary" />
          </div>
        </div>
      </div>
    </section>
  );
}
