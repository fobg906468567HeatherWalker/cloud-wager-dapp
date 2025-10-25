import { HeroCloud } from "@/components/landing/HeroCloud";
import { CityShowcase } from "@/components/landing/CityShowcase";
import { HowItWorks } from "@/components/landing/HowItWorks";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroCloud />
      <CityShowcase />
      <HowItWorks />
    </div>
  );
};

export default Index;
