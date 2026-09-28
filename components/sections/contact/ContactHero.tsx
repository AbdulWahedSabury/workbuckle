import Reveal from "@/components/motion/Reveal";

export default function ContactHero() {
  return (
    <section className="pt-10 pb-8 sm:pt-12 lg:pt-16">
      <div className="container-site">
        <Reveal effect="slideInBottom" className="mx-auto max-w-2xl text-center">
          <h1 className="mb-4 text-4xl leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Contact us
          </h1>
          <p className="text-pretty text-base leading-relaxed sm:text-lg">
            We&apos;re here to understand your needs and provide tailored solutions. Reach out to
            our team to explore how we can support your goals and address any questions you may
            have.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
