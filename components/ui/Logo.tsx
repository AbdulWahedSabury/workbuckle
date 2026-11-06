"use client"
import { useSiteSetting } from "@/providers/SiteSettingProvider";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface LogoProps {
  tone?: "dark" | "light";
  href?: string;
}

export default function Logo({ tone = "light", href = "/" }: LogoProps) {
    const {logo,name} = useSiteSetting();
    const t = useTranslations("layout.logo");
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label={t("label")}>
      <Image
        src={logo}
        alt={t("alt")}
        width={44}
        height={44}
        className="size-10 object-contain lg:size-11"
        preload
      />
      {name}
    </Link>
  );
}
