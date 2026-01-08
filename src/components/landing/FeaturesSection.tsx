import { useState, useEffect, useRef } from "react";
import { Zap, Brain, Camera, Database, Mail } from "lucide-react";

const systemModules = [
  {
    id: "ignition",
    icon: Zap,
    title: "Daily Actions",
    description: "Each morning, you see what to do today — based on your goals and pipeline.",
    detail: "The system reviews your database and surfaces the next actions. Clear and simple.",
    proofPoint: "Clear next steps"
  },
  {
    id: "pipeline",
    icon: Brain,
    title: "Pipeline",
    description: "Contacts move through stages based on activity, not manual updates.",
    detail: "The system tracks interactions and repositions contacts automatically.",
    proofPoint: "Automatic tracking"
  },
  {
    id: "screenshot",
    icon: Camera,
    title: "Screenshot Input",
    description: "Drop a screenshot of a text, email, or post. Context is extracted.",
    detail: "No copying or pasting. The system reads it and suggests the next step.",
    proofPoint: "Direct input"
  },
  {
    id: "database",
    icon: Database,
    title: "Database",
    description: "Your contacts, organized. The system surfaces who needs attention.",
    detail: "You don't check the database. It checks itself and tells you what matters.",
    proofPoint: "Self-maintaining"
  },
  {
    id: "mailchimp",
    icon: Mail,
    title: "Mailchimp Sync",
    description: "Generate messages for any contact with one click.",
    detail: "Consistent follow-up without copywriting. Ready to send.",
    proofPoint: "One-click messages"
  }
];

export function FeaturesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleModules, setVisibleModules] = useState<Set<number>>(new Set([0]));
  const sectionRef = useRef<HTMLElement>(null);
  const moduleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    moduleRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              setActiveIndex(index);
              setVisibleModules((prev) => new Set([...prev, index]));
            }
          });
        },
        { threshold: [0.5], rootMargin: "-10% 0px -30% 0px" }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-20 md:py-32 lg:py-40 overflow-hidden"
    >
      {/* Cinematic dark gradient background with subtle noise */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card to-background" />
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
      
      {/* Subtle animated gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-5xl mx-auto px-5 md:px-6">
        {/* Header */}
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-light text-foreground mb-4 md:mb-6 tracking-tight">
            How it works
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto opacity-70">
            The system, explained.
          </p>
        </div>

        {/* Story Flow - Vertical modules */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent hidden md:block" />
          
          <div className="space-y-8 md:space-y-12 lg:space-y-16">
            {systemModules.map((module, index) => {
              const Icon = module.icon;
              const isActive = activeIndex === index;
              const isVisible = visibleModules.has(index);
              const isPast = index < activeIndex;

              return (
                <div
                  key={module.id}
                  ref={(el) => (moduleRefs.current[index] = el)}
                  className={`
                    relative transition-all duration-700 ease-out
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                  `}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Module Card */}
                  <div
                    className={`
                      system-module relative rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10
                      backdrop-blur-sm transition-all duration-500
                      ${isActive 
                        ? 'bg-card/80 border border-primary/20 shadow-[0_0_60px_-20px_hsl(var(--primary)/0.3)]' 
                        : isPast
                          ? 'bg-card/40 border border-border/30'
                          : 'bg-card/30 border border-border/20'
                      }
                    `}
                  >
                    {/* Glow effect on active */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                    )}

                    <div className="relative flex flex-col md:flex-row md:items-start gap-5 md:gap-8">
                      {/* Icon */}
                      <div
                        className={`
                          relative flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl
                          flex items-center justify-center transition-all duration-500
                          ${isActive 
                            ? 'bg-primary/15 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)]' 
                            : 'bg-muted/50'
                          }
                        `}
                      >
                        <Icon
                          className={`
                            w-7 h-7 md:w-8 md:h-8 transition-all duration-500
                            ${isActive ? 'text-primary' : 'text-muted-foreground'}
                          `}
                        />
                        
                        {/* Active glow ring */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-2xl border border-primary/30 animate-pulse-slow" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`
                            text-lg md:text-xl lg:text-2xl font-medium mb-2 md:mb-3
                            transition-colors duration-500
                            ${isActive ? 'text-foreground' : 'text-foreground/70'}
                          `}
                        >
                          {module.title}
                        </h3>
                        
                        <p
                          className={`
                            text-sm md:text-base leading-relaxed mb-3 md:mb-4
                            transition-colors duration-500
                            ${isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'}
                          `}
                        >
                          {module.description}
                        </p>

                        {/* Expanded detail - only visible when active */}
                        <div
                          className={`
                            overflow-hidden transition-all duration-500 ease-out
                            ${isActive ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}
                          `}
                        >
                          <p className="text-sm text-muted-foreground/80 leading-relaxed mb-4">
                            {module.detail}
                          </p>
                        </div>

                        {/* Proof point */}
                        <div
                          className={`
                            inline-flex items-center gap-2 transition-all duration-500
                            ${isActive ? 'opacity-100' : 'opacity-50'}
                          `}
                        >
                          <div
                            className={`
                              w-1.5 h-1.5 rounded-full transition-all duration-500
                              ${isActive ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]' : 'bg-muted-foreground/30'}
                            `}
                          />
                          <span
                            className={`
                              text-xs font-medium transition-colors duration-500
                              ${isActive ? 'text-primary' : 'text-muted-foreground/50'}
                            `}
                          >
                            {module.proofPoint}
                          </span>
                        </div>
                      </div>

                      {/* Step indicator - desktop only */}
                      <div className="hidden lg:flex items-center gap-3 opacity-50">
                        <span className="text-xs text-muted-foreground font-mono">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className={`
                          w-8 h-px transition-colors duration-500
                          ${isActive ? 'bg-primary/50' : 'bg-border'}
                        `} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flow indicator dots - mobile only */}
        <div className="flex justify-center gap-2 mt-12 md:hidden">
          {systemModules.map((_, index) => (
            <div
              key={index}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${activeIndex === index 
                  ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]' 
                  : 'bg-border'
                }
              `}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
