import Link from "next/link";
import FadeUp from "@/components/motion/FadeUp";
import RevealSection from "@/components/motion/RevealSection";
import FooterLinkColumns from "@/components/layout/FooterLinkColumns";
import SocialLinks from "@/components/layout/SocialLinks";
import Logo from "@/components/ui/Logo";
import { FOOTER_COLUMNS } from "@/constants/footerColumn";
import { useTranslations } from "next-intl";

export default function Footer() {
  const n = useTranslations('navigation');
  const t = useTranslations('layout.footer');

  return (
    <RevealSection as="footer" amount={0.1} className="border-t border-line pt-[60px] pb-8 lg:pt-[80px]">
      <div className="container-site">
        <div className="mb-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-[60px]">
          <FadeUp>
            <Logo />
            <p className="mt-6 mb-8 max-w-[380px]">
              {t('about')}
            </p>
          </FadeUp>

          <FadeUp className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterLinkColumns columns={FOOTER_COLUMNS} />
            <div className="col-span-2 sm:col-span-3">
              <h3 className="mb-4 text-lg">{t('follow_us')}</h3>
              <SocialLinks />
            </div>
          </FadeUp>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Work Buckle. All rights reserved.</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/privacy" className="hover:text-ink">
              {n('privacy')}
            </Link>
            <Link href="/terms" className="hover:text-ink">
                {n('terms')}
            </Link>
          </p>
        </div>
      </div>
    </RevealSection>
  );
}
