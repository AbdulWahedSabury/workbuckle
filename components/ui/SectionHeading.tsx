import type { ReactNode } from "react";

interface SectionHeadingProps {
  children: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}

export default function SectionHeading({
  children,
  align = "left",
  tone = "dark",
  className = "",
}: SectionHeadingProps) {
  return (
    <h2
      className={`mb-8 text-3xl sm:text-4xl lg:mb-[50px] lg:text-5xl ${
        align === "center" ? "mx-auto max-w-[720px] text-center" : "max-w-[760px]"
      } ${tone === "light" ? "text-white" : "text-ink"} ${className}`}
    >
      {children}
    </h2>
  );
}
