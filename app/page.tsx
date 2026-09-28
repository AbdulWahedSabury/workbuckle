import Companies from "@/components/companies/Companies";
import CtaBanner from "@/components/home/CtaBanner";
import HeroSection from "@/components/hero/HeroSection";
import JobBoard from "@/components/home/JobBoard";
import AvailablePositions from "@/components/available_positions/AvailablePositions";
import Testimonials from "@/components/testimonials/Testimonials";
import WhyCyprus from "@/components/why_cyprus/WhyCyprus";
import HowToApply from "@/components/how_it_works/HowToApply";
import RelocationBenefits from "@/components/relocation/RelocationBenefits";
import ContactFaq from "@/components/sections/contact/ContactFaq";
import { getAllJobs } from "@/lib/mantal";

export default async function HomePage() {
  const apiJobs = await getAllJobs();
  return (
    <>
      <HeroSection />
      <WhyCyprus />
      <Companies />
      <AvailablePositions />
      <HowToApply />
      <RelocationBenefits />
      <JobBoard initialJobs={apiJobs} />
      <Testimonials />
      <ContactFaq />
      <CtaBanner />
    </>
  );
}
