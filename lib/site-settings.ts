import 'server-only';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import type { RawApiSettings, Setting } from '@/types/setting';

/** SiteSetting is a single-row table; this is that row's id. */
export const SITE_SETTING_ID = 1;

/** Used when the row is missing (fresh database) or unreachable. */
export const DEFAULT_SITE_NAME = 'Work Buckle';

/**
 * Public read of the settings row (no auth check, unlike getSiteSettings in lib/admin/queries.ts).
 * Returns null if the row doesn't exist or the database is unreachable, so callers fall back to defaults.
 */
export const getPublicSiteSettings = cache(async (): Promise<RawApiSettings | null> => {
  try {
    return await prisma.siteSetting.findUnique({ where: { id: SITE_SETTING_ID } });
  } catch (error) {
    console.error('Failed to load site settings:', error);
    return null;
  }
});

/**
 * Maps the raw row to the app-wide Setting shape. Nulls become "", and fields the
 * schema doesn't store yet (tiktok, youtube, whats_app, working_hours, locales) get empty defaults.
 */
export function toSetting(raw: RawApiSettings | null): Setting {
  return {
    name: raw?.siteName || DEFAULT_SITE_NAME,
    phone: raw?.contactPhone ?? '',
    facebook: raw?.facebookUrl ?? '',
    instagram: raw?.instagramUrl ?? '',
    tiktok: '',
    linkedin: raw?.linkedinUrl ?? '',
    youtube: '',
    whats_app: '',
    about: raw?.about ?? '',
    meta_title: raw?.metaTitle ?? '',
    meta_description: raw?.metaDescription ?? '',
    logo: raw?.logoUrl ?? '',
    working_hours: [],
    locales: {},
  };
}

/**
 * Settings for server components, metadata and the root layout. Cached per request,
 * so the layout, generateMetadata and any page calling it share one query.
 */
export const getSiteSetting = cache(async (): Promise<Setting> => toSetting(await getPublicSiteSettings()));

/**
 * The admin's maintenance switch (Settings), for the public site and its forms.
 * `message` is the admin's own text, or "" to show the default notice.
 * Off when the settings can't be read, so a database blip doesn't close the site.
 */
export async function getMaintenance(): Promise<{ on: boolean; message: string }> {
  const settings = await getPublicSiteSettings();
  return { on: settings?.maintenanceMode ?? false, message: settings?.maintenanceMessage ?? '' };
}
