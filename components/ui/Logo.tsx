import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  tone?: "dark" | "light";
  href?: string;
}

export default function Logo({ tone = "dark", href = "/" }: LogoProps) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="Work Buckle home">
      <Image
        src="/images/logo.png"
        alt="Work Buckle logo mark — orange magnifier speech bubble with black WB monogram"
        width={44}
        height={44}
        className="size-10 object-contain lg:size-11"
        preload
      />
      WorkBuckle
    </Link>
  );
}
