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
  return (
    <FadeUp
      className={`mb-10 lg:mb-[50px] ${align === "center" ? "mx-auto max-w-[720px] text-center" : "max-w-[760px]"}`}
    >
      <span
        className={`mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${
          light ? "bg-white/10 text-primary" : "bg-primary/10 text-primary-dark"
        }`}
      >
        {eyebrow}
      </span>
      <h2 className={`text-[32px] tracking-tight sm:text-[40px] lg:text-[48px] ${light ? "text-white" : "text-ink"}`}>
        {title}
      </h2>
      {description && <p className={`mt-3 text-lg ${light ? "text-white/60" : "text-gray-2"}`}>{description}</p>}
    </FadeUp>
  );
}
