import { Check } from "lucide-react";

const PIPELINE_STAGES = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Showing",
  "Offer",
  "Under Contract",
  "Closed",
];

interface StageTrackerProps {
  currentStage: number; // 0-indexed, which stage is current
}

export function StageTracker({ currentStage }: StageTrackerProps) {
  return (
    <div className="px-6 py-5 border-t border-border/20">
      <h3 className="text-xs text-primary/80 uppercase tracking-wider mb-4">
        Pipeline Stage
      </h3>
      
      <div className="relative flex items-center justify-between">
        {/* Connecting line - background */}
        <div className="absolute top-3 left-3 right-3 h-0.5 bg-border/30" />
        
        {/* Connecting line - progress (animated) */}
        <div 
          className="absolute top-3 left-3 h-0.5 bg-gradient-to-r from-primary via-primary to-blue-500 transition-all duration-1000 ease-out"
          style={{ 
            width: `calc(${(currentStage / (PIPELINE_STAGES.length - 1)) * 100}% - 24px)`,
          }}
        />
        
        {/* Stage nodes */}
        {PIPELINE_STAGES.map((stage, index) => {
          const isCompleted = index < currentStage;
          const isCurrent = index === currentStage;
          const isFuture = index > currentStage;
          
          return (
            <div 
              key={stage} 
              className="relative flex flex-col items-center z-10"
              style={{ 
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Node circle */}
              <div 
                className={`
                  relative w-6 h-6 rounded-full flex items-center justify-center
                  transition-all duration-500 ease-out
                  ${isCompleted 
                    ? "bg-primary shadow-[0_0_12px_rgba(34,197,94,0.5)]" 
                    : isCurrent 
                      ? "bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.6)] animate-pulse" 
                      : "bg-secondary/50 border border-border/40"
                  }
                `}
                style={{
                  animationDelay: `${index * 150}ms`,
                }}
              >
                {isCompleted && (
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                )}
                {isCurrent && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
                
                {/* Glow effect for completed/current */}
                {(isCompleted || isCurrent) && (
                  <div 
                    className={`
                      absolute inset-0 rounded-full blur-md opacity-40
                      ${isCompleted ? "bg-primary" : "bg-blue-500"}
                    `}
                  />
                )}
              </div>
              
              {/* Stage label */}
              <span 
                className={`
                  mt-2 text-[10px] text-center max-w-[60px] leading-tight
                  transition-colors duration-300
                  ${isCompleted 
                    ? "text-primary/80" 
                    : isCurrent 
                      ? "text-blue-400 font-medium" 
                      : "text-muted-foreground/40"
                  }
                `}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
