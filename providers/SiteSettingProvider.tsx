'use client';

import { createContext, useContext } from 'react';
import type { Setting } from '@/types/setting';

const SiteSettingContext = createContext<Setting | null>(null);

/** Makes the settings fetched in app/layout.tsx available to client components. */
export default function SiteSettingProvider({
  setting,
  children,
}: {
  setting: Setting;
  children: React.ReactNode;
}) {
  return <SiteSettingContext.Provider value={setting}>{children}</SiteSettingContext.Provider>;
}

/** Site settings in client components. Server components call getSiteSetting() from lib/site-settings instead. */
export function useSiteSetting(): Setting {
  const setting = useContext(SiteSettingContext);
  if (!setting) throw new Error('useSiteSetting must be used inside <SiteSettingProvider>.');
  return setting;
}
