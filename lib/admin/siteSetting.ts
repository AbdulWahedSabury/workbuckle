import { prisma } from "../prisma";
import { SITE_SETTING_ID } from "../site-settings";
import { requireView } from "./auth";

export { SITE_SETTING_ID };

export async function getSiteSettings() {
  await requireView('settings');
  return prisma.siteSetting.findUnique({ where: { id: SITE_SETTING_ID } });
}
