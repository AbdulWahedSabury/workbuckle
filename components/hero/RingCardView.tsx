import Image from "next/image";
import BadgeIcon from "./BadgeIcon";
type RingCard = {
  key: string;
  src: string;
  alt: string;
  badge: [string, string];
  icon: unknown;
  pillBg?: string;
  /** Repeats exist only to fill the ring, so screen readers skip them. */
  decorative: boolean;
};
export default function RingCardView({ card }: { card: RingCard }) {
  return (
    <figure className="group relative h-full w-full overflow-hidden rounded-[22px] border border-white/15 bg-white/5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]">
      <Image
        src={card.src}
        alt={card.decorative ? "" : card.alt}
        fill
        sizes="(min-width: 1024px) 210px, (min-width: 768px) 180px, 150px"
        className="object-cover"
      />

      {/* Readability gradient + glass sheen */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent opacity-60 mix-blend-overlay" />

      {/* Badge */}
      <figcaption className="absolute inset-x-2 bottom-2 sm:inset-x-3 sm:bottom-3">
        <div
          className={`flex items-center gap-2 rounded-2xl px-2.5 py-2 text-left backdrop-blur-md ${
            card.pillBg ?? "bg-white/15"
          }`}
        >
          <span className="grid size-7 flex-none place-items-center rounded-full bg-white text-ink">
            <BadgeIcon icon={card.icon} />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[11px] font-semibold text-white sm:text-xs">
              {card.badge[0]}
            </span>
            <span className="block truncate text-[10px] text-white/70 sm:text-[11px]">
              {card.badge[1]}
            </span>
          </span>
        </div>
      </figcaption>
    </figure>
  );
}