import { cn } from "@/lib/utils";

const SEGMENTS = 20; // one per 5%
/** Each segment is a rounded block on the ring: wider across the ring than along it, with a small gap between. */
const SEGMENT = { along: 9.5, across: 14, radius: 4, ringRadius: 40 };

/** Tailwind's sky-500. Colours are set as SVG attributes, not utility classes, so the ring never depends on the stylesheet. */
const FILLED_COLOR = "#0ea5e9";

const SEGMENT_ANGLES = Array.from({ length: SEGMENTS }, (_, i) => (i + 0.5) * (360 / SEGMENTS));

/** A candidate's CV-to-job match as a segmented ring: one block lights up per 5%. */
export default function MatchBadge({ match, size = 60, className }: { match: number; size?: number; className?: string }) {
  const filled = Math.round(Math.min(100, Math.max(0, match)) / (100 / SEGMENTS));
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`${match}% match`}
      className={cn("shrink-0", className)}
    >
      <title>How closely the CV matches this job (semantic similarity)</title>
      {SEGMENT_ANGLES.map((angle, i) => (
        <rect
          key={angle}
          x={50 - SEGMENT.along / 2}
          y={50 - SEGMENT.ringRadius - SEGMENT.across / 2}
          width={SEGMENT.along}
          height={SEGMENT.across}
          rx={SEGMENT.radius}
          transform={`rotate(${angle} 50 50)`}
          fill={i < filled ? FILLED_COLOR : "var(--color-ink)"}
          fillOpacity={i < filled ? 1 : 0.12}
        />
      ))}
      <text
        x="50"
        y="51"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--color-ink)"
        fontSize="20"
        fontWeight="800"
        className="tabular-nums"
      >
        {match}%
      </text>
    </svg>
  );
}
