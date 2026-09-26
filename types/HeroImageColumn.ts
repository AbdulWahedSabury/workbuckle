import type { Badge } from "./badge";

export type PillSize = "side" | "center";

export type HeroImageColumn = {
  image: { src: string; alt: string };
  pillBg: string;
  size: PillSize;
  badge: Badge;
  badgePosition: "above" | "below";
  offset: string;
};