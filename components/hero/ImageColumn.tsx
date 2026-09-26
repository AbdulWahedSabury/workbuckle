import { motion } from "framer-motion";
import Image from "next/image";
import { HeroImageColumn } from "@/types/HeroImageColumn";
import { Badge } from "@/types/badge";
const columnDelay = (i: number) => 0.45 + i * 0.15;
const EASE = [0.25, 1, 0.5, 1] as const; // outQuart

const PILL_HEIGHTS = {
  side: "h-[160px] sm:h-[270px] md:h-[370px] lg:h-[270px] xl:h-[350px] min-[1440px]:h-[370px] min-[1920px]:h-[470px]",
  center:
    "h-[170px] sm:h-[300px] md:h-[400px] lg:h-[350px] xl:h-[400px] min-[1440px]:h-[420px] min-[1920px]:h-[550px]",
}as const;


export default function ImageColumn({ image, index }: { image: HeroImageColumn; index: number }) {
  const delay = columnDelay(index);
  const badgeFirst = image.badgePosition === "above";

  const pill = (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, ease: EASE, delay }}
      className={`group relative w-full overflow-hidden rounded-full ${image.pillBg} ${PILL_HEIGHTS[image.size]}`}
    >
      <Image
        src={image.image.src}
        alt={image.image.alt}
        fill
        sizes="(min-width: 1024px) 18vw, 32vw"
        preload={index === 1}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
    </motion.div>
  );

  const line = (
    <motion.div
      aria-hidden="true"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.5, ease: EASE, delay: delay + 0.45 }}
      style={{ originY: badgeFirst ? 1 : 0 }}
      className="mx-auto h-10 w-0.5 bg-line xl:h-[60px] min-[1920px]:h-20"
    />
  );

  const badge = <HexBadge badge={image.badge} delay={delay + 0.75} floatIndex={index} />;

  return (
    <div className={`flex flex-col items-center ${image.offset}`}>
      {badgeFirst ? (
        <>
          {badge}
          {line}
          {pill}
        </>
      ) : (
        <>
          {pill}
          {line}
          {badge}
        </>
      )}
    </div>
  );
}


const HEX_PATH =
  "M92.68 6.65C99.73 2.59 108.4 2.59 115.45 6.65L182.06 45.11C189.1 49.18 193.44 56.69 193.44 64.83V141.74C193.44 149.87 189.1 157.39 182.06 161.45L115.45 199.91C108.4 203.97 99.73 203.97 92.68 199.91L26.08 161.45C19.03 157.39 14.69 149.87 14.69 141.74V64.83C14.69 56.69 19.03 49.18 26.08 45.11L92.68 6.65Z";

const HEX_TONES = {
  light: { fill: "fill-gray-3", text: "text-ink", icon: "text-primary" },
  dark: { fill: "fill-ink", text: "text-white", icon: "text-primary" },
  primary: { fill: "fill-primary", text: "text-white", icon: "text-white" },
};

function HexBadge({ badge, delay, floatIndex }: { badge: Badge; delay: number; floatIndex: number }) {
  const tone = HEX_TONES[badge.tone];
  const Icon = badge.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 160, damping: 14, delay }}
      className="w-[92px] sm:w-[130px] md:w-[180px] lg:w-full"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4 + floatIndex * 0.6, repeat: Infinity, ease: "easeInOut", delay: delay + 0.8 }}
      >
        <motion.div
          whileHover={{ rotate: 8, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="relative aspect-[208/207] cursor-default"
        >
          <svg viewBox="0 0 208 207" className={`absolute inset-0 size-full ${tone.fill}`} aria-hidden="true">
            <path d={HEX_PATH} />
          </svg>
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-[18%] text-center sm:gap-1.5 ${tone.text}`}
          >
            <Icon className={`size-4 sm:size-6 md:size-7 ${tone.icon}`} strokeWidth={2.25} aria-hidden="true" />
            <p className="font-heading text-xs leading-snug font-semibold sm:text-sm md:text-lg lg:text-sm xl:text-lg">
              {badge.label[0]}
              <br />
              {badge.label[1]}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}