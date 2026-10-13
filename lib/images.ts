// Client-safe: used by next/image call sites on the site.

const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`
  : null;

/**
 * True for images the Next image optimizer may load: /public paths and our
 * Supabase bucket (see images.remotePatterns in next.config.ts). Pass
 * `unoptimized` for anything else, e.g. a URL an admin typed in, so it is
 * served as-is instead of failing on an unconfigured host.
 */
export function canOptimizeImage(src: string): boolean {
  return (src.startsWith("/") && !src.startsWith("//")) || (STORAGE_URL !== null && src.startsWith(STORAGE_URL));
}
