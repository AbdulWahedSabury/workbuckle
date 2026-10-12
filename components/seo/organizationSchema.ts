import type { Setting } from "@/types/setting";

/** schema.org Organization for the root JSON-LD; empty settings fields are left out. */
export function organizationSchema(setting: Setting) {
  const sameAs = [setting.facebook, setting.instagram, setting.linkedin, setting.tiktok, setting.youtube].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: setting.name,
    ...(setting.about && { description: setting.about }),
    ...(setting.logo && { logo: setting.logo }),
    ...(setting.email && { email: setting.email }),
    ...(setting.phone && { telephone: setting.phone }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}
