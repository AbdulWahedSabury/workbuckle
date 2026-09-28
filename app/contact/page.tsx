import type { Metadata } from "next";
import ContactHero from "@/components/sections/contact/ContactHero";
import ContactMain from "@/components/sections/contact/ContactMain";
import ContactFaq from "@/components/sections/contact/ContactFaq";
import { getAllJobs } from "@/lib/mantal";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach out to the Work Buckle team — we're here to understand your needs and provide tailored solutions.",
};

export default async function ContactPage() {
  const jobs = await getAllJobs();
  console.log(jobs);
  return (
    <>
    <div className="space-y-4">
        {jobs.map((job: any) => (
          <div className="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase tracking-wider">
            {job.contract_details ? job.contract_details.replace('_', ' ') : 'Full Time'}
          </span>
          
          {job.is_remote && (
            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              Remote
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-150">
          {job.position_name}
        </h3>

        <p className="mt-3 text-sm text-slate-600 line-clamp-3 leading-relaxed">
          "desc"
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          Ref: {job.hash}
        </span>
        <a
          href={`/jobs/${job.id}`}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          View Details
          <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </div>
        ))}
      </div>
      <ContactHero />
      <ContactMain />
      <ContactFaq />
    </>
  );
}
