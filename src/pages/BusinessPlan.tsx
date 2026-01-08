import { Target, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface Strategy {
  id: string;
  text: string;
}

const strategies = {
  leadGeneration: [
    { id: "lg1", text: "Host 2 open houses per month" },
    { id: "lg2", text: "Send weekly market updates to SOI" },
    { id: "lg3", text: "Call 5 expired listings weekly" },
    { id: "lg4", text: "Attend 1 networking event monthly" },
  ],
  clientExperience: [
    { id: "ce1", text: "Respond to all leads within 1 hour" },
    { id: "ce2", text: "Send closing gift within 48 hours" },
    { id: "ce3", text: "Provide weekly transaction updates" },
    { id: "ce4", text: "Schedule 30-day post-close check-in" },
  ],
  leverageScale: [
    { id: "ls1", text: "Automate lead follow-up sequences" },
    { id: "ls2", text: "Batch social media content weekly" },
    { id: "ls3", text: "Outsource listing photography" },
    { id: "ls4", text: "Use templates for common communications" },
  ],
};

function StrategyColumn({ 
  title, 
  strategies,
  defaultExpanded = true
}: { 
  title: string; 
  strategies: Strategy[];
  defaultExpanded?: boolean;
}) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (isMobile) {
    return (
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 touch-target"
        >
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{strategies.length} items</span>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </button>
        
        {expanded && (
          <ul className="px-4 pb-4 space-y-3 animate-fade-in">
            {strategies.map((strategy, index) => (
              <li 
                key={strategy.id}
                className="flex items-start gap-3 text-sm text-muted-foreground"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 flex-shrink-0" />
                <span className="leading-relaxed">{strategy.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="strategy-column">
      <h3 className="text-sm font-medium text-foreground mb-4">{title}</h3>
      <ul className="space-y-3">
        {strategies.map((strategy, index) => (
          <li 
            key={strategy.id}
            className="flex items-start gap-2 text-sm text-muted-foreground animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 flex-shrink-0" />
            <span className="leading-relaxed">{strategy.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BusinessPlan() {
  const isMobile = useIsMobile();

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl font-semibold text-foreground">Business Plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Annual focus.
        </p>
      </div>

      {/* Single Business Goal - Visually dominant */}
      <div className="mb-6 md:mb-10 p-5 md:p-6 rounded-xl bg-card border border-border text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-3 md:mb-4">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
          Close $180,000 in GCI
        </h2>
        <p className="text-sm text-muted-foreground">
          2025 Business Goal • 15 closed transactions
        </p>
      </div>

      {/* Strategy columns - Stacked on mobile */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 md:mb-4">
          Strategic Pillars
        </h2>
        
        {isMobile ? (
          /* Mobile: Stacked collapsible sections */
          <div className="space-y-3">
            <StrategyColumn 
              title="Lead Generation" 
              strategies={strategies.leadGeneration}
              defaultExpanded={true}
            />
            <StrategyColumn 
              title="Client Experience" 
              strategies={strategies.clientExperience}
              defaultExpanded={false}
            />
            <StrategyColumn 
              title="Leverage & Scale" 
              strategies={strategies.leverageScale}
              defaultExpanded={false}
            />
          </div>
        ) : (
          /* Desktop: Three columns */
          <div className="grid grid-cols-3 gap-6">
            <StrategyColumn 
              title="Lead Generation" 
              strategies={strategies.leadGeneration} 
            />
            <StrategyColumn 
              title="Client Experience" 
              strategies={strategies.clientExperience} 
            />
            <StrategyColumn 
              title="Leverage & Scale" 
              strategies={strategies.leverageScale} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
