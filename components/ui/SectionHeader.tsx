import FadeUp from "@/components/motion/FadeUp";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
}: SectionHeaderProps) {
  const light = tone === "light";
  const centered = align === "center";

  return (
    <FadeUp
      className={`mb-8 w-full sm:mb-10 lg:mb-12 ${
        centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left"
      }`}
    >
      <span
        className={`mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider sm:mb-4 sm:px-4 sm:py-1.5 sm:text-sm ${
          light ? "bg-white/10 text-primary" : "bg-primary/10 text-primary-dark"
        }`}
      >
        {eyebrow}
      </span>

      <h2
        className={`text-balance break-words text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl ${
          light ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>

      {description && (
        <p
          className={`mt-3 max-w-2xl text-pretty text-base leading-relaxed sm:mt-4 sm:text-lg ${
            centered ? "mx-auto" : ""
          } ${light ? "text-white/60" : "text-gray-2"}`}
        >
          {description}
        </p>
      )}
    </FadeUp>
  );
}