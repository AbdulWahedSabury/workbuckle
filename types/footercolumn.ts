import type { Menu } from "@/types/navigation";

export interface FooterColumn {
  title: string;
  /** Labels are keys under `navigation` in lang/*.json. */
  links: Menu;
}