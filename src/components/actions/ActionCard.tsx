import { Check, Circle } from "lucide-react";

interface ActionCardProps {
  title: string;
  description: string;
  priority?: "high" | "medium" | "low";
  completed?: boolean;
  onComplete?: () => void;
  compact?: boolean;
}

export function ActionCard({ 
  title, 
  description, 
  priority = "medium",
  completed = false,
  onComplete,
  compact = false
}: ActionCardProps) {
  const priorityColors = {
    high: "border-l-primary",
    medium: "border-l-accent",
    low: "border-l-muted-foreground/30",
  };

  const priorityBadge = {
    high: { label: "High", class: "bg-primary/10 text-primary" },
    medium: { label: "Med", class: "bg-accent/10 text-accent" },
    low: { label: "Low", class: "bg-muted text-muted-foreground" },
  };

  return (
    <div 
      className={`action-card border-l-2 ${priorityColors[priority]} ${completed ? "opacity-50" : ""} ${compact ? "p-3" : ""}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onComplete}
          className={`mt-0.5 flex-shrink-0 w-6 h-6 md:w-5 md:h-5 rounded-full border transition-all duration-200 flex items-center justify-center touch-target ${
            completed 
              ? "bg-primary border-primary" 
              : "border-muted-foreground/40 hover:border-primary/60 active:border-primary"
          }`}
        >
          {completed ? (
            <Check className="w-3.5 h-3.5 md:w-3 md:h-3 text-primary-foreground" />
          ) : (
            <Circle className="w-3 h-3 text-transparent" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-medium leading-snug ${completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {title}
            </h4>
            {compact && !completed && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${priorityBadge[priority].class}`}>
                {priorityBadge[priority].label}
              </span>
            )}
          </div>
          <p className={`mt-1 text-xs text-muted-foreground leading-relaxed ${compact ? "line-clamp-2" : ""}`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
