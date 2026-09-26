import { FooterColumn } from "@/types/footercolumn";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface FooterLinkColumnsProps {
  columns: FooterColumn[];
}

export default function FooterLinkColumns({ columns }: FooterLinkColumnsProps) {
    const n = useTranslations('navigation');
  return (
    <>
      {columns.map((col) => (
        <div key={col.title}>
          <h3 className="mb-5 text-lg sm:text-xl">{col.title}</h3>
          <ul className="flex flex-col gap-3">
            {col.links.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="inline-block text-ink/80 transition-[color,transform] duration-300 hover:translate-x-1 hover:text-primary-dark"
                >
                  {n(l.label)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
