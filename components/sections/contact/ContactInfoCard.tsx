import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import FadeUp from "@/components/motion/FadeUp";

interface ContactInfoCardProps {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}

/** Centered gray card: dark icon tile, title, and free-form content (link, text, social icons…). */
export default function ContactInfoCard({ icon: Icon, title, children }: ContactInfoCardProps) {
  return (
    <FadeUp className="flex flex-col items-center rounded-card bg-gray-3 p-5 text-center">
      <div className="mb-5 flex size-[60px] items-center justify-center rounded-xl bg-ink text-white">
        <Icon className="size-[30px]" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-xl">{title}</h3>
      {children}
    </FadeUp>
  );
}
