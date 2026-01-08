interface GoalCardProps {
  title: string;
  value: string | number;
  target?: string | number;
  subtitle?: string;
  variant?: "yearly" | "monthly";
  compact?: boolean;
}

export function GoalCard({ title, value, target, subtitle, variant = "monthly", compact = false }: GoalCardProps) {
  if (compact) {
    // Compact horizontal layout for mobile
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg bg-secondary/30 ${variant === "yearly" ? "border border-primary/20" : ""}`}>
        <div className="min-w-0">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{title}</span>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-baseline gap-1.5 flex-shrink-0 ml-3">
          <span className={`font-semibold ${variant === "yearly" ? "text-lg text-primary" : "text-base text-foreground/90"}`}>
            {value}
          </span>
          {target && (
            <span className="text-xs text-muted-foreground">/ {target}</span>
          )}
        </div>
      </div>
    );
  }

  // Default vertical layout
  return (
    <div className={`goal-card ${variant === "yearly" ? "border-primary/20" : ""}`}>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{title}</span>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`font-semibold ${variant === "yearly" ? "text-2xl text-foreground" : "text-lg text-foreground/90"}`}>
          {value}
        </span>
        {target && (
          <span className="text-sm text-muted-foreground">/ {target}</span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
