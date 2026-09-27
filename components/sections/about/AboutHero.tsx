import Image from "next/image";
import ArrowButton from "@/components/ui/ArrowButton";
import Reveal from "@/components/motion/Reveal";
import Parallax from "@/components/motion/Parallax";
import { useTranslations } from "next-intl";
import CtaButton from "@/components/ui/CtaButton";

interface PhotoItem {
  src: string;
  alt: string;
  /** Fixed desktop size; below lg the photos fill their grid cell instead. */
  size: string;
  /** Scroll parallax range in vh (reference "Image Scroll" interaction) */
  parallax: [from: number, to: number];
}

const leftPhotos: PhotoItem[] = [
  {
    src: "/images/about/hero-1.png",
    alt: "Candidate smiling during a video interview",
    size: "lg:h-[250px] lg:w-[240px] xl:h-[280px] xl:w-[290px] 2xl:h-[320px] 2xl:w-[340px]",
    parallax: [-5, 5],
  },
  {
    src: "/images/about/hero-2.jpg",
    alt: "Two colleagues reviewing a resume together",
    size: "lg:h-[170px] lg:w-[190px] lg:self-end xl:h-[190px] xl:w-[230px] 2xl:h-[210px] 2xl:w-[270px]",
    parallax: [5, -5],
  },
  {
    src: "/images/about/hero-3.png",
    alt: "Work Buckle team working in a bright office",
    size: "lg:h-[180px] lg:w-[250px] xl:h-[210px] xl:w-[300px] 2xl:h-[250px] 2xl:w-[360px]",
    parallax: [5, -5],
  },
];

const rightPhotos: PhotoItem[] = [
  {
    src: "/images/about/hero-4.jpg",
    alt: "Recruiter shaking hands with a new hire",
    size: "lg:h-[250px] lg:w-[250px] lg:self-end xl:h-[280px] xl:w-[300px] 2xl:h-[320px] 2xl:w-[360px]",
    parallax: [5, -6],
  },
  {
    src: "/images/about/hero.png",
    alt: "Team celebrating around a laptop",
    size: "lg:h-[250px] lg:w-[240px] xl:h-[280px] xl:w-[290px] 2xl:h-[320px] 2xl:w-[340px]",
    parallax: [-6, 5],
  },
];

function PhotoCard({ photo, sizes }: { photo: PhotoItem; sizes: string }) {
  const [from, to] = photo.parallax;
  return (
    <Parallax
      from={from}
      to={to}
      className={`w-full lg:max-w-full ${photo.size}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm-card bg-gray-3 sm:rounded-card lg:aspect-auto lg:h-full">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          className="object-cover"
          preload
        />
      </div>
    </Parallax>
  );
}

export default function AboutHero() {
  const t = useTranslations("pages.about");
  return (
    <section className="relative overflow-x-clip pt-10 pb-15 sm:pt-12 lg:pt-14 lg:pb-22.5 xl:pt-16 2xl:pt-20">
      <div className="container-site">
        <Reveal
          effect="growIn"
          delay={0}
          offset={0}
          className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1.3fr_1fr] lg:gap-10 xl:gap-15"
        >
          {/* Left photos */}
          <div className="order-2 grid grid-cols-3 gap-4 md:gap-8 lg:order-1 lg:grid-cols-1 lg:gap-10 2xl:gap-12">
            {leftPhotos.map((p) => (
              <PhotoCard
                key={p.src}
                photo={p}
                sizes="(min-width: 1024px) 360px, 33vw"
              />
            ))}
          </div>

          <div className="order-1 flex flex-col items-center text-center lg:order-2">
            <h1 className="mb-4 text-3xl leading-tight tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-3xl xl:text-4xl 2xl:text-5xl">
              {t("title")}
            </h1>
            <p className="mb-8 max-w-lg text-base leading-relaxed text-pretty 2xl:text-lg">
              {t("headline")}
            </p>
            <CtaButton href="/jobs">{t("cta")}</CtaButton>
          </div>

          {/* Right photos */}
          <div className="order-3 grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-1 lg:gap-16 xl:gap-20 2xl:gap-24">
            {rightPhotos.map((p) => (
              <PhotoCard
                key={p.src}
                photo={p}
                sizes="(min-width: 1024px) 360px, 50vw"
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
