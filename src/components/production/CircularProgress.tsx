interface CircularProgressProps {
  label: string;
  current: number | string;
  target: number;
  subtitle?: string;
  compact?: boolean;
}

export function CircularProgress({ label, current, target, subtitle, compact = false }: CircularProgressProps) {
  const numericCurrent = typeof current === 'number' ? current : parseFloat(current.replace(/[^0-9.]/g, ''));
  const percentage = Math.min((numericCurrent / target) * 100, 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const gap = target - numericCurrent;

  if (compact) {
    // Compact horizontal layout for mobile
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
        <div className="circular-indicator w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="10"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-semibold text-foreground">{current}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground block">{label}</span>
          {gap > 0 && (
            <span className="text-xs text-muted-foreground">{gap} to goal</span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground block">{subtitle}</span>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-xs text-muted-foreground">Target</span>
          <span className="text-sm font-medium text-foreground block">
            {typeof target === 'number' && target >= 1000 ? `$${(target / 1000).toFixed(0)}K` : target}
          </span>
        </div>
      </div>
    );
  }

  // Default vertical layout for desktop
  return (
    <div className="flex flex-col items-center">
      <div className="circular-indicator w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-foreground">{current}</span>
        </div>
      </div>
      <span className="mt-3 text-sm font-medium text-foreground">{label}</span>
      {gap > 0 && (
        <span className="text-xs text-muted-foreground">{gap} to goal</span>
      )}
      {subtitle && (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      )}
    </div>
  );
}
