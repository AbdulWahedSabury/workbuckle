import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Briefcase, MapPin } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import ArrowButton from "@/components/ui/ArrowButton";
import { companies, type Company } from "@/lib/data";

function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      href="#"
      className="group flex h-full w-full flex-col rounded-card bg-gray-3 p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-[30px]"
    >
      <div className="mb-6 flex size-[70px] items-center justify-center rounded-sm-card border border-line bg-white lg:mb-[30px]">
        <Image
          src={company.logo}
          alt={`${company.name} logo (square, ~80×80)`}
          width={40}
          height={40}
          className="size-10 rounded-lg object-contain"
        />
      </div>
      <div className="mb-8 lg:mb-10">
        <h3 className="mb-2 text-[22px]">{company.name}</h3>
        <p className="flex items-center gap-1 text-ink">
          <MapPin className="size-[18px]" /> {company.location}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between">
        <span className="flex items-center gap-1 text-ink">
          <Briefcase className="size-[18px]" /> {company.openings} open roles
        </span>
        <span className="flex size-10 items-center justify-center rounded-full bg-white text-ink transition-all duration-300 group-hover:rotate-45 group-hover:bg-primary">
          <ArrowUpRight className="size-5" />
        </span>
      </div>
    </Link>
  );
}

export default function TopCompanies() {
  const firstRow = companies.slice(0, 3);
  const secondRow = companies.slice(3, 5);

  return (
    <section id="companies" className="section-spacing">
      <div className="container-site">
        <SectionHeading>Companies hiring on Work Buckle right now</SectionHeading>

        <div className="grid grid-cols-1 gap-5 lg:gap-[30px]">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[30px]">
            {firstRow.map((c) => (
              <CompanyCard key={c.name} company={c} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.03fr_0.5fr] lg:gap-[30px]">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-[30px]">
              {secondRow.map((c) => (
                <CompanyCard key={c.name} company={c} />
              ))}
            </div>
            <div className="flex flex-col justify-between gap-10 rounded-card bg-primary p-6 sm:p-[30px]">
              <h4 className="text-[24px] sm:text-[28px]">
                Hiring? Put your openings in front of motivated candidates.
              </h4>
              <div className="flex flex-col items-end">
                <ArrowButton href="#pricing" label="List your company" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
