import { useTranslations } from "next-intl";
import { CONTACT, mailHref, telHref } from "@/lib/contact";

/** A section in `<namespace>.sections` (lang/*.json). `list` sets how its `items` render; a section with id "contact" also shows the contact details. */
export type LegalSection = { id: string; list?: "ul" | "ol" };

const number = (index: number) => String(index + 1).padStart(2, "0");

export default function LegalContent({ namespace, sections }: { namespace: string; sections: readonly LegalSection[] }) {
  const t = useTranslations(namespace);

  const contactRows = [
    { label: t("sections.contact.email"), value: CONTACT.email, href: mailHref(CONTACT.email) },
    { label: t("sections.contact.phone"), value: CONTACT.phone, href: telHref(CONTACT.phone) },
    { label: t("sections.contact.address"), value: CONTACT.address },
  ];

  return (
    <section className="pb-[60px] md:pb-[75px] lg:pb-[90px]">
      <div className="container-site">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[240px_1fr] xl:gap-15">
          {/* Table of contents */}
          <aside className="hidden lg:block">
            <nav aria-label={t("toc")} className="sticky top-28">
              <p className="mb-4 text-xs font-semibold tracking-wider text-ink uppercase">{t("toc")}</p>
              <ol className="flex flex-col gap-1 border-l border-line">
                {sections.map(({ id }, i) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="-ml-px flex gap-3 border-l border-transparent py-1.5 pl-4 text-sm text-gray-2 transition-colors duration-200 hover:border-primary hover:text-ink"
                    >
                      <span className="text-primary-dark tabular-nums">{number(i)}</span>
                      {t(`sections.${id}.title`)}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="divide-y divide-line rounded-card border border-line bg-gray-3 px-5 sm:px-10 lg:px-12">
            {sections.map((section, i) => {
              const { id } = section;
              const items = section.list ? (t.raw(`sections.${id}.items`) as string[]) : [];
              const List = section.list ?? null;

              return (
                <section key={id} id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28 py-8 sm:py-10">
                  <h2 id={`${id}-title`} className="mb-4 flex items-baseline gap-3 text-xl sm:text-2xl">
                    <span className="text-base text-primary-dark tabular-nums sm:text-lg">{number(i)}</span>
                    {t(`sections.${id}.title`)}
                  </h2>
                  <p className="leading-relaxed text-pretty">{t(`sections.${id}.body`)}</p>

                  {List && (
                    <List
                      className={`mt-5 flex flex-col gap-3 pl-5 leading-relaxed text-ink/80 marker:text-primary-dark ${
                        List === "ol" ? "list-decimal marker:font-semibold" : "list-disc"
                      }`}
                    >
                      {items.map((item) => (
                        <li key={item} className="pl-1">
                          {item}
                        </li>
                      ))}
                    </List>
                  )}

                  {id === "contact" && (
                    <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {contactRows.map((row) => (
                        <div key={row.label} className="rounded-sm-card bg-white p-5">
                          <dt className="mb-1 text-xs font-semibold tracking-wider text-gray-2 uppercase">
                            {row.label}
                          </dt>
                          <dd className="break-words text-ink">
                            {row.href ? (
                              <a href={row.href} className="transition-colors hover:text-primary-dark">
                                {row.value}
                              </a>
                            ) : (
                              row.value
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </section>
              );
            })}
          </article>
        </div>
      </div>
    </section>
  );
}
