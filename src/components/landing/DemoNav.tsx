import { NavLink } from "react-router-dom";
import { Sparkles } from "lucide-react";

const demoNavItems = [
  { path: "/demo/goals", label: "Goals & Actions" },
  { path: "/demo/business-plan", label: "Business Plan" },
  { path: "/demo/pipeline", label: "Pipeline" },
  { path: "/demo/production", label: "Production" },
  { path: "/demo/database", label: "Database" },
];

export function DemoNav() {
  return (
    <section className="py-16 px-6 border-t border-border/30">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-6">
          <Sparkles className="w-3 h-3 text-accent" />
          <span className="text-xs text-accent">Demo</span>
        </div>
        <h3 className="text-xl font-light text-foreground mb-2">
          Preview the system
        </h3>
        <p className="text-sm text-muted-foreground mb-8">
          Sample data. Nothing saves until you create an account.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-3">
          {demoNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground bg-secondary/50 border border-border/50 hover:text-foreground hover:border-accent/50 hover:bg-secondary transition-all duration-200"
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </section>
  );
}
