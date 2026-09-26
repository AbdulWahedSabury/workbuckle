import { usePathname } from '@/i18n/navigation';

export function useRoot() {
  const path = usePathname();
  const isHome = path === '/';
  return isHome;
}
