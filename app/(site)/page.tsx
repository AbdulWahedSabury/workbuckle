import Companies from "@/components/companies/Companies";
import CtaBanner from "@/components/ui/CtaBanner";
import HeroSection from "@/components/hero/HeroSection";
import JobBoard from "@/components/jobs/JobBoard";
import JobCategories from "@/components/job_categories/JobCategories";
import AvailablePositions from "@/components/available_positions/AvailablePositions";
import Testimonials from "@/components/testimonials/Testimonials";
import WhyCyprus from "@/components/why_cyprus/WhyCyprus";
import HowToApply from "@/components/how_it_works/HowToApply";
import RelocationBenefits from "@/components/relocation/RelocationBenefits";
import Faq from "@/components/sections/contact/Faq";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <HeroSection />
      <AvailablePositions />
      <JobCategories />
      <WhyCyprus />
      <Companies />
      <HowToApply />
      <RelocationBenefits />
      <JobBoard searchParams={searchParams} />
      <Testimonials />
      <Faq />
      <CtaBanner />
    </>
  );
}
