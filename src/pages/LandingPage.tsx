import { LandingNav } from "@/components/landing/LandingNav";
import { IgnitionFlow } from "@/components/landing/IgnitionFlow";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { DemoNav } from "@/components/landing/DemoNav";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <IgnitionFlow />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <DemoNav />
      <Footer />
    </div>
  );
}
