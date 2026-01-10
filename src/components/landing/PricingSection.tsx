import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const includedFeatures = [
  "Daily action list",
  "Contact suggestions",
  "Screenshot input",
  "Mailchimp messages",
  "Pipeline tracking",
  "Unlimited contacts",
  "Support"
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 md:py-24 lg:py-32 px-5 md:px-6 relative">
      {/* Subtle top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="max-w-3xl mx-auto text-center">
        {/* Header */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-foreground mb-4 leading-snug">
          Pricing
        </h2>
        <p className="text-muted-foreground mb-10 md:mb-16 max-w-lg mx-auto text-sm md:text-base">
          One plan. Cancel anytime.
        </p>
        
        {/* Pricing Card */}
        <div className="relative">
          <div className="absolute -inset-px rounded-2xl md:rounded-3xl bg-gradient-to-b from-primary/20 to-transparent blur-sm" />
          <div className="relative p-6 md:p-8 lg:p-10 rounded-2xl md:rounded-3xl bg-card border border-border/50">
            <div className="mb-6 md:mb-8">
              <span className="text-muted-foreground text-sm">RealCoach Pro</span>
              <div className="flex items-baseline justify-center gap-2 mt-2">
                <span className="text-4xl md:text-5xl font-light text-foreground">$99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
            
            <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10 text-left max-w-xs mx-auto">
              {includedFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_hsl(156_100%_50%/0.3)] hover:shadow-[0_0_40px_hsl(156_100%_50%/0.4)] transition-all duration-300 min-h-[52px]"
              asChild
            >
              <a href="#ignition">Preview the system</a>
            </Button>
            
            <p className="text-xs text-muted-foreground mt-4">
              No credit card required
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
