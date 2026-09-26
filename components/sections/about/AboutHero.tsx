import Image from "next/image";
import ArrowButton from "@/components/ui/ArrowButton";
import Reveal from "@/components/motion/Reveal";
import Parallax from "@/components/motion/Parallax";

interface Photo {
  src: string;
  alt: string;
  /** Fixed desktop size; below lg the photos fill their grid cell instead. */
  size: string;
  /** Scroll parallax range in vh (reference "Image Scroll" interaction) */
  parallax: [from: number, to: number];
}

const leftPhotos: Photo[] = [
  {
    src: "/images/about/hero-1.png",
    alt: "About collage 1 — candidate smiling during a video interview (~320×400)",
    size: "lg:h-[170px] lg:w-[160px] 2xl:h-[200px]",
    parallax: [-5, 5],
  },
  {
    src: "/images/about/hero-2.png",
    alt: "About collage 2 — two colleagues reviewing a resume together (~400×320)",
    size: "lg:h-[150px] lg:w-[170px] 2xl:h-[160px] 2xl:w-[200px] lg:self-end",
    parallax: [5, -5],
  },
  {
    src: "/images/about/hero-3.png",
    alt: "About collage 3 — Work Buckle team working in a bright office (~600×400)",
    size: "lg:h-[160px] lg:w-[250px] 2xl:h-[200px] 2xl:w-[300px]",
    parallax: [5, -5],
  },
];

const rightPhotos: Photo[] = [
  {
    src: "/images/about/hero-4.png",
    alt: "About collage 4 — recruiter shaking hands with a new hire (~600×440)",
    size: "lg:h-[220px] lg:w-[250px] 2xl:w-[300px] lg:self-end",
    parallax: [5, -6],
  },
  {
    src: "/images/about/hero-5.png",
    alt: "About collage 5 — team celebrating around a laptop (~600×440)",
    size: "lg:h-[220px] lg:w-[260px] 2xl:w-[300px]",
    parallax: [-6, 5],
  },
];

function Photo({ photo }: { photo: Photo }) {
  const [from, to] = photo.parallax;
  return (
    <Parallax from={from} to={to} className={`w-full ${photo.size}`}>
      <div className="relative aspect-[4/3] h-full w-full overflow-hidden rounded-sm-card bg-gray-3 sm:rounded-card lg:aspect-auto">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 1024px) 300px, 33vw"
          className="object-cover"
          preload
        />
      </div>
    </Parallax>
  );
}

export default function AboutHero() {
  return (
    <section className="pt-5 sm:pt-10 xl:pt-[50px] 2xl:pt-[70px]">
      <div className="container-site">
        {/* growIn: fades in from 75% scale on load, like the reference hero grid */}
        <Reveal
          effect="growIn"
          delay={0}
          offset={0}
          className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1.4fr_1fr] lg:gap-10 xl:gap-[60px]"
        >
          {/* Left column: 3 photos stacked on desktop, one row of 3 on tablet/mobile */}
          <div className="order-2 grid grid-cols-3 gap-5 md:gap-10 lg:order-1 lg:grid-cols-1 lg:gap-[60px]">
            {leftPhotos.map((p) => (
              <Photo key={p.src} photo={p} />
            ))}
          </div>

          {/* Center title */}
          <div className="order-1 flex flex-col items-center text-center lg:order-2">
            <p className="mb-4 rounded-full bg-gray-3 px-4 py-1.5 text-sm font-semibold text-ink">About Work Buckle</p>
            <h1 className="mb-2.5 text-[42px] leading-[1.2em] md:text-[52px] xl:text-[50px] 2xl:text-[60px] 2xl:leading-[1.3em]">
              We help people find work they are proud of.
            </h1>
            <p className="mb-[30px] max-w-[480px]">
              Work Buckle started as a small side project to fix one frustration: job boards full of roles that
              were already gone. Today we connect thousands of candidates with teams that are actually hiring.
            </p>
            <ArrowButton href="/#jobs" label="Explore open roles" variant="primary" />
          </div>

          {/* Right column: 2 photos */}
          <div className="order-3 grid grid-cols-2 gap-5 md:gap-10 lg:grid-cols-1 lg:gap-[110px] 2xl:gap-[140px]">
            {rightPhotos.map((p) => (
              <Photo key={p.src} photo={p} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
