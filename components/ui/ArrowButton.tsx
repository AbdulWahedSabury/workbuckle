import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Variant = "dark" | "primary" | "light";

const styles: Record<Variant, { button: string; circle: string }> = {
  dark: {
    button: "bg-ink text-white border-ink",
    circle: "bg-primary text-ink group-hover:bg-white",
  },
  primary: {
    button: "bg-primary text-ink border-primary",
    circle: "bg-ink text-white group-hover:bg-white group-hover:text-ink",
  },
  light: {
    button: "bg-white text-ink border-white",
    circle: "bg-primary text-ink group-hover:bg-ink group-hover:text-white",
  },
};

interface ArrowButtonProps {
  href: string;
  label: string;
  variant?: Variant;
  className?: string;
}

/**
 * Pill button with a trailing arrow chip (the reference's ".button-arrow-*" style).
 * On hover the arrow flies out to the top-right while a second arrow slides in
 * from the bottom-left, and the chip turns white — 500ms, as on the reference.
 */
export default function ArrowButton({
  href,
  label,
  variant = "dark",
  className = "",
}: ArrowButtonProps) {
  const s = styles[variant];
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 rounded-full border py-2 pr-2 pl-4 text-base font-semibold transition-all duration-500 ${s.button} ${className}`}
    >
      <span className="leading-normal">{label}</span>
      <span
        className={`relative flex size-[30px] flex-none items-center justify-center overflow-hidden rounded-full transition-colors duration-500 ${s.circle}`}
      >
        <ArrowUpRight
          className="absolute size-4 transition-transform duration-500 group-hover:translate-x-5 group-hover:-translate-y-5"
          strokeWidth={2.25}
          aria-hidden="true"
        />
        <ArrowUpRight
          className="absolute size-4 -translate-x-5 translate-y-5 transition-transform duration-500 group-hover:translate-x-0 group-hover:translate-y-0"
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
