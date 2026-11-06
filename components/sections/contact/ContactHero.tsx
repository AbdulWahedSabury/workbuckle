import Image from "next/image";
import { useTranslations } from "next-intl";
import Reveal from "@/components/motion/Reveal";

// Placeholder photo: point this at the final image when it's ready, and update
// `pages.contact.hero_image_alt` in lang/en.json to describe it. A wide image works
// best, since it's cropped to a banner. Text sits centered on top under a dark overlay.
const HERO_IMAGE = "/images/hero/hospitality.png";

/** Full-width image hero with the page title and intro centered on top. */
export default function ContactHero() {
  const t = useTranslations("pages.contact");

  return (
    <section className="relative isolate flex min-h-[380px] items-center overflow-hidden bg-ink lg:min-h-[520px]">
      <Image
        src={HERO_IMAGE}
        alt={t("hero_image_alt")}
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover object-[center_20%]"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/75" />

      <div className="container-site py-16 lg:py-24">
        <Reveal effect="slideInBottom" delay={0} offset={0} className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-semibold tracking-wider text-on-primary uppercase sm:text-sm">
            {t("hero_eyebrow")}
          </span>
          <h1 className="mb-5 text-5xl tracking-tight text-balance text-white lg:text-7xl">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-pretty text-white sm:text-lg">
            {t("description")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
