import type { Metadata } from "next";
import { connection } from "next/server";
import PageHeader from "@/components/admin/PageHeader";
import SettingsForm from "@/components/admin/SettingsForm";
import { getSiteSettings } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Site settings" };

const DEFAULT_SETTINGS = {
  siteName: "Workbuckle",
  contactEmail: null,
  contactPhone: null,
  logoUrl: null,
  faviconUrl: null,
  maintenanceMode: false,
  maintenanceMessage: null,
};

export default async function SettingsPage() {
  await connection();
  // The row is created on first save, so fall back to defaults until then.
  const settings = (await getSiteSettings()) ?? DEFAULT_SETTINGS;

  return (
    <>
      <PageHeader
        title="Site settings"
        description="Global configuration for the public website."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
