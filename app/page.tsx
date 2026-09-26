import Categories from "@/components/home/Categories";
import Companies from "@/components/companies/Companies";
import CtaBanner from "@/components/home/CtaBanner";
import HeroSection from "@/components/hero/HeroSection";
import JobBoard from "@/components/home/JobBoard";
import Testimonials from "@/components/home/Testimonials";
import WhyCyprus from "@/components/why_cyprus/WhyCyprus";

export default function HomePage() {
  return (
      <>
        <HeroSection />
        <WhyCyprus />
        <Companies />
        <Categories />
        <JobBoard />
        <Testimonials />
        <CtaBanner />
        </>
  );
}
