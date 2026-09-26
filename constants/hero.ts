import { HeroImageColumn } from "@/types/HeroImageColumn";
import { Check, Hand, Search } from "lucide-react";

export const HERO_IMAGES = [
  {
    id: "barman",
    src: "/images/barman.jpg",
    size: "side",
    icon: Check,
    tone: "dark",
    pillBg: "bg-primary",
    badgePosition: "below",
    offset: "",
  },
  {
    id: "frontdesk",
    src: "/images/frontdesk.jpg",
    size: "center",
    icon: Search,
    tone: "dark",
    pillBg: "bg-primary",
    badgePosition: "above",
    offset: "mt-[clamp(40px,4vw,80px)]",
  },
  {
    id: "waitress",
    src: "/images/waiteres.jpg",
    size: "side",
    icon: Hand,
    tone: "dark",
    pillBg: "bg-primary",
    badgePosition: "above",
    offset: "-mt-[clamp(50px,13vw,260px)]",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  src: string;
  size: HeroImageColumn["size"];
  icon: HeroImageColumn["badge"]["icon"];
  tone: HeroImageColumn["badge"]["tone"];
  pillBg: string;
  badgePosition: HeroImageColumn["badgePosition"];
  offset: string;
}>;