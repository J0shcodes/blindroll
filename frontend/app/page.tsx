import { Footer } from "@/components/Footer";
import { CTASection } from "@/components/landing/CTASection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SecurityPropertiesSection } from "@/components/landing/SecurityPropertiesSection";
import { Navigation } from "@/components/Navigation";

export default function Home() {
  return (
    <main className="bg-bg-primary text-text-primary">
      <Navigation />
      <div className="pt-16">
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <SecurityPropertiesSection />
        <FeaturesSection />
        <CTASection />
        <Footer />
      </div>
    </main>
  );
}
