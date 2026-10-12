import type { SiteSetting } from "@/lib/generated/prisma/browser";

/**
 * The settings row as Prisma returns it: camelCase, nullable optional fields.
 * Derived from the model so it can't drift from prisma/schema.prisma.
 */
export type RawApiSettings = Omit<SiteSetting, "id" | "createdAt" | "updatedAt">;

/** App-wide settings shape: snake_case, never null (missing values are ""). */
export interface Setting {
  name: string;
  email: string;
  phone: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  linkedin: string;
  youtube: string;
  whats_app: string;
  about: string;
  meta_title: string;
  meta_description: string;
  logo: string;
  working_hours: Array<{ day: string; hours: string }>;
  locales: Record<string, string>;
}
